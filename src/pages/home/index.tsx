import Navigate from "@/components/home/navigate";
import type { FormProps } from "antd";
import { Button, Form, Input, message, Radio, Select } from "antd";
import { ethers } from "ethers";
import { useState, useEffect } from "react";
import { useWalletClient, useConfig } from "wagmi";
import { writeContract } from "wagmi/actions";
import { abi } from "@/config/EchoooMallPayment.json";
import { abi as erc20Abi } from "@/config/Erc20.json";

type FieldType = {
  transactionId?: string; // 交易 id
  amount?: string; // 交易数量
  merchanAddress?: string; // 商户地址
  receivingAddress?: string; // 接收地址
  currency?: string; // 选择的币种
  transactionIdBytes32?: string;
};

const { Option } = Select;

const echoooMallPaymentAddress = "0x0A9901653413432F193a4397293667ebDEFc9da9";
const USDCAddress = "0xA3799376C9C71a02e9b79369B929654B037a410D";

export default function Index() {
  const [form] = Form.useForm();
  const { data: walletClient } = useWalletClient();
  const config = useConfig();
  const [isWithdraw, setIsWithdraw] = useState(false); // 状态：是否为“提取资金”
  const [isRefund, setIsRefund] = useState(false); // 状态：是否为“退款”
  const [txHash, setTxHash] = useState<string>("");
  const [txIdBytes32, setTxIdBytes32] = useState<string>("");

  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    try {
      // 下单逻辑
      if (!walletClient) {
        console.error("No wallet client found.");
        return;
      }
      if (isWithdraw) {
        try {
          // 提现逻辑
          console.log("Withdraw initiated");
          const transactionBatch = values.transactionIdBytes32?.split(",")
          const txWithdraw = await writeContract(config, {
            address: echoooMallPaymentAddress,
            abi,
            functionName: "withdrawFundsBatch",
            args: [transactionBatch, values.receivingAddress],
          });

          setTxHash(txWithdraw);
          message.success("Withdraw successful!");
        } catch (error) {
          message.error("Transaction error!");
          console.error(error);
        }
      } else if (isRefund) {
        try {
          // 退款逻辑
          const transactionBatch = values.transactionIdBytes32?.split(",")
          const txReceive = await writeContract(config, {
            address: echoooMallPaymentAddress,
            abi,
            functionName: "refundOrdersBatch",
            args: [transactionBatch],
          });
          setTxHash(txReceive);
          message.success("Refund successful!");
        } catch (error) {
          message.error("Transaction error!");
          console.error(error);
        }
      } else {
        await writeContract(config, {
          address: USDCAddress,
          abi: erc20Abi,
          functionName: "approve",
          args: [
            echoooMallPaymentAddress,
            ethers.utils.parseUnits(String(values.amount), 18),
          ],
        });

        const transactionIdBytes32 = ethers.utils.formatBytes32String(
          String(Math.random())
        );
        setTxIdBytes32(transactionIdBytes32);
        const txPay = await writeContract(config, {
          address: echoooMallPaymentAddress,
          abi,
          functionName: "placeOrder",
          args: [
            transactionIdBytes32,
            USDCAddress,
            ethers.utils.parseUnits(String(values.amount), 18),
            values.merchanAddress,
          ],
        });
        setTxHash(txPay);
        message.success("Order placed successfully!");
      }
    } catch (error) {
      message.error("Transaction error!");
      console.error(error);
    }
  };

  const onFinishFailed: FormProps<FieldType>["onFinishFailed"] = (
    errorInfo
  ) => {
    console.log("Failed:", errorInfo);
  };

  useEffect(() => {
    form.resetFields(); // 清空表单
    setTxIdBytes32("");
    setTxHash("");
  }, [isWithdraw, isRefund]);

  return (
    <div className="flex flex-col w-screen h-screen bg-[#f7f9fb]">
      <Navigate />
      <div className="flex justify-center mt-20 flex-col">
        <Form
          form={form}
          name="basic"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          style={{ maxWidth: 1000, position: "relative" }}
          initialValues={{
            remember: true,
            currency: "USDC",
          }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
        >
          {/* 切换模式按钮 */}
          <Radio.Group
            onChange={(e) => {
              const value = e.target.value;
              setIsWithdraw(value === "withdraw");
              setIsRefund(value === "refund");
            }}
            value={isWithdraw ? "withdraw" : isRefund ? "refund" : "order"}
            style={{
              position: "absolute",
              top: -40,
              left: 200,
            }}
          >
            <Radio.Button value="order">Order</Radio.Button>
            <Radio.Button value="withdraw">Withdraw</Radio.Button>
            <Radio.Button value="refund">Refund</Radio.Button>
          </Radio.Group>
          {/* 动态表单 */}
          {isWithdraw ? (
            <>
              <Form.Item<FieldType>
                label="Transaction ID Bytes32"
                name="transactionIdBytes32"
                rules={[
                  {
                    required: true,
                    message: "Please input your transaction id bytes32!",
                  },
                ]}
              >
                <Input className="ml-16" placeholder="transaction id bytes32 01,transaction id bytes32 02"/>
              </Form.Item>
              <Form.Item<FieldType>
                label="Receiving Address"
                name="receivingAddress"
                rules={[
                  {
                    required: true,
                    message: "Please input your receiving address!",
                  },
                ]}
              >
                <Input className="ml-16" />
              </Form.Item>
            </>
          ) : isRefund ? (
            <>
              <Form.Item<FieldType>
                label="Transaction ID Bytes32"
                name="transactionIdBytes32"
                rules={[
                  {
                    required: true,
                    message: "Please input your transaction id bytes32!",
                  },
                ]}
              >
                <Input className="ml-16" placeholder="transaction id bytes32 01,transaction id bytes32 02"/>
              </Form.Item>
            </>
          ) : (
            <>
              <Form.Item<FieldType>
                label="Currency"
                name="currency"
                rules={[
                  {
                    required: true,
                    message: "Please select your currency!",
                  },
                ]}
              >
                <Select placeholder="Select Currency" className="ml-16">
                  <Option value="USDC">USDC</Option>
                </Select>
              </Form.Item>
              <Form.Item<FieldType>
                label="Amount"
                name="amount"
                rules={[
                  {
                    required: true,
                    message: "Please input the transaction amount!",
                  },
                ]}
              >
                <Input className="ml-16" />
              </Form.Item>
              <Form.Item<FieldType>
                label="Merchan Address"
                name="merchanAddress"
                rules={[
                  {
                    required: true,
                    message: "Please input your merchant address!",
                  },
                ]}
              >
                <Input className="ml-16" />
              </Form.Item>
            </>
          )}
          <div className="flex justify-center flex-col w-screen items-center">
            <span>tx: {txHash}</span>
            {!isRefund && !isWithdraw ? (
              <span>transactionIdBytes32: {txIdBytes32}</span>
            ) : null}
          </div>
          <Form.Item
            style={{
              position: "absolute",
              bottom: -60,
              right: 0,
            }}
          >
            <Button type="primary" htmlType="submit">
              {isWithdraw ? "Withdraw" : isRefund ? "Refund" : "Submit"}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
