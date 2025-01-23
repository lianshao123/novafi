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
  transactionIdBytes32?: string;
  receivingAddress?: string;
  currency?: string;
  amount?: string;
  merchanAddress?: string;
  address?: string;
};

const { Option } = Select;

const echoooMallPaymentAddress = "0x0A9901653413432F193a4397293667ebDEFc9da9";
const USDCAddress = "0xA3799376C9C71a02e9b79369B929654B037a410D";

export default function Index() {
  const [form] = Form.useForm();
  const { data: walletClient } = useWalletClient();
  const config = useConfig();
  const [currentAction, setCurrentAction] = useState("order"); // 当前操作类型
  const [txHash, setTxHash] = useState<string>("");
  const [txIdBytes32, setTxIdBytes32] = useState<string>("");

  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    try {
      if (!walletClient) {
        console.error("No wallet client found.");
        return;
      }
      if (currentAction === "withdraw") {
        const transactionBatch = values.transactionIdBytes32?.split(",");
        const txWithdraw = await writeContract(config, {
          address: echoooMallPaymentAddress,
          abi,
          functionName: "withdrawFundsBatch",
          args: [transactionBatch, values.receivingAddress],
        });
        setTxHash(txWithdraw);
        message.success("Withdraw successful!");
      } else if (currentAction === "refund") {
        const transactionBatch = values.transactionIdBytes32?.split(",");
        const txRefund = await writeContract(config, {
          address: echoooMallPaymentAddress,
          abi,
          functionName: "refundOrdersBatch",
          args: [transactionBatch],
        });
        setTxHash(txRefund);
        message.success("Refund successful!");
      } else if (currentAction === "lockTx") {        
        const txLock = await writeContract(config, {
          address: echoooMallPaymentAddress,
          abi,
          functionName: "lockTransaction",
          args: [values.transactionIdBytes32],
        });
        setTxHash(txLock);
        message.success("Lock Transaction successful!");
      } else if (currentAction === "unlockTx") {
        const txUnlock = await writeContract(config, {
          address: echoooMallPaymentAddress,
          abi,
          functionName: "unlockTransaction",
          args: [values.transactionIdBytes32],
        });
        setTxHash(txUnlock);
        message.success("Unlock Transaction successful!");
      } else if (currentAction === "lockUser") {
        const txLockUser = await writeContract(config, {
          address: echoooMallPaymentAddress,
          abi,
          functionName: "lockUser",
          args: [values.address],
        });
        setTxHash(txLockUser);
        message.success("Lock User successful!");
      } else if (currentAction === "unlockUser") {
        const txUnlockUser = await writeContract(config, {
          address: echoooMallPaymentAddress,
          abi,
          functionName: "unlockUser",
          args: [values.address],
        });
        setTxHash(txUnlockUser);
        message.success("Unlock User successful!");
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

  useEffect(() => {
    form.resetFields(); // 清空表单
    setTxHash("");
  }, [currentAction]);

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
          initialValues={{ currency: "USDC" }}
          onFinish={onFinish}
          autoComplete="off"
        >
          {/* 切换模式按钮 */}
          <Radio.Group
            onChange={(e) => setCurrentAction(e.target.value)}
            value={currentAction}
            style={{ position: "absolute", top: -40, left: 200 }}
          >
            <Radio.Button value="order">Order</Radio.Button>
            <Radio.Button value="withdraw">Withdraw</Radio.Button>
            <Radio.Button value="refund">Refund</Radio.Button>
            <Radio.Button value="lockTx">LockTx</Radio.Button>
            <Radio.Button value="unlockTx">UnlockTx</Radio.Button>
            <Radio.Button value="lockUser">LockUser</Radio.Button>
            <Radio.Button value="unlockUser">UnlockUser</Radio.Button>
          </Radio.Group>

          {/* 动态表单 */}
          {(currentAction === "withdraw" ||
            currentAction === "refund" ||
            currentAction === "lockTx" ||
            currentAction === "unlockTx") && (
            <Form.Item<FieldType>
              label="Transaction ID Bytes32"
              name="transactionIdBytes32"
              rules={[
                {
                  required: true,
                  message: "Please input the transaction id bytes32!",
                },
              ]}
            >
              <Input
                className="ml-16"
                placeholder="Transaction ID Bytes32 01,Transaction ID Bytes32 02"
              />
            </Form.Item>
          )}

          {(currentAction === "lockUser" || currentAction === "unlockUser") && (
            <Form.Item<FieldType>
              label="Address"
              name="address"
              rules={[
                {
                  required: true,
                  message: "Please input the address!",
                },
              ]}
            >
              <Input className="ml-16" placeholder="address" />
            </Form.Item>
          )}

          {currentAction === "withdraw" && (
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
          )}

          {currentAction === "order" && (
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
                <Select className="ml-16">
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
                label="Merchant Address"
                name="merchanAddress"
                rules={[
                  {
                    required: true,
                    message: "Please input the merchant address!",
                  },
                ]}
              >
                <Input className="ml-16" />
              </Form.Item>
            </>
          )}

          <div className="flex justify-center flex-col w-screen items-center">
            <span>tx: {txHash}</span>
            {currentAction === "order" ? (
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
              Submit ({currentAction})
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
