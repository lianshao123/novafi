import Navigate from "@/components/home/navigate";
import type { FormProps } from "antd";
import { Button, Form, Input, message, Radio, Select } from "antd";
import { ethers } from "ethers";
import { useState, useEffect } from "react";
import { useWalletClient, useConfig, useAccount } from "wagmi";
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
  payMethod?: string;
};

const { Option } = Select;

const echoooMallPaymentAddress = "0x82FfCAc4b0896AC1ab0F8DE62DEd6b93d986Cf30";
const USDCAddress = "0xA3799376C9C71a02e9b79369B929654B037a410D";

export default function Index() {
  const [form] = Form.useForm();
  const { data: walletClient } = useWalletClient();
  const config = useConfig();
  const [currentAction, setCurrentAction] = useState("withdraw"); // 当前操作类型
  const [txHash, setTxHash] = useState<string>("");
  const [txIdBytes32, setTxIdBytes32] = useState<string>("");
  const { address, isConnected } = useAccount();

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
        console.log("values======", values);

        const transactionBatch = values.transactionIdBytes32?.split(",");
        const amounts = values.amount?.split(",").map(amount => ethers.utils.parseUnits(amount.trim(), 18)) as any[];
        if(values.payMethod === "1") {
          // 计算总退款金额
          const totalRefundAmount = amounts.reduce((acc, amount) => acc.add(amount), ethers.BigNumber.from(0));
          // 商户批准合约转账金额（用于 MerchantWithdrawal）
          const approveTx = await writeContract(config, {
            address: USDCAddress,
            abi: erc20Abi,
            functionName: "approve",
            args: [
              echoooMallPaymentAddress,
              totalRefundAmount,
            ],
          });
          console.log("ApproveTx:", approveTx);
        }

        const txRefund = await writeContract(config, {
          address: echoooMallPaymentAddress,
          abi,
          functionName: "refundOrdersBatchFromMerchant",
          args: [transactionBatch, amounts, values.payMethod]
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
        const approveTx = await writeContract(config, {
          address: USDCAddress,
          abi: erc20Abi,
          functionName: "approve",
          args: [
            echoooMallPaymentAddress,
            ethers.utils.parseUnits(String(values.amount), 18),
          ],
        });
        console.log("approveTx:", approveTx);
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

  useEffect(() => {
    if (isConnected && address) {
      form.setFieldsValue({ receivingAddress: address });
    }
  }, [isConnected, address, form]);

  return (
    <div className="flex flex-col w-screen h-screen bg-[#f7f9fb]">
      <Navigate />
      <div className="flex justify-center mt-20 flex-col items-center">
        <Form
          form={form}
          name="basic"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          style={{ maxWidth: 1000, position: "relative" }}
          initialValues={{ payMethod: "0" }}
          onFinish={onFinish}
          autoComplete="off"
        >
          {/* 切换模式按钮 */}
          <div className="flex justify-center">
            <Radio.Group
              onChange={(e) => setCurrentAction(e.target.value)}
              value={currentAction}
              style={{ position: "absolute", top: -40 }}
              className="lg:left-[200px]"
            >
              <div className="flex">
                {/* <Radio.Button value="order">Order</Radio.Button> */}
                <Radio.Button
                  value="withdraw"
                  className="w-[63px] text-[10px] flex items-center justify-center lg:w-[90px] lg:text-sm"
                >
                  Withdraw
                </Radio.Button>
                <Radio.Button
                  value="refund"
                  className="w-[63px] text-[10px] flex items-center justify-center lg:w-[90px] lg:text-sm"
                >
                  Refund
                </Radio.Button>
                <Radio.Button
                  value="lockTx"
                  className="w-[63px] text-[10px] flex items-center justify-center lg:w-[90px] lg:text-sm"
                >
                  LockTx
                </Radio.Button>
                <Radio.Button
                  value="unlockTx"
                  className="w-[63px] text-[10px] flex items-center justify-center lg:w-[90px] lg:text-sm"
                >
                  UnlockTx
                </Radio.Button>
                <Radio.Button
                  value="lockUser"
                  className="w-[63px] text-[10px] flex items-center justify-center lg:w-[90px] lg:text-sm"
                >
                  LockUser
                </Radio.Button>
                <Radio.Button
                  value="unlockUser"
                  className="w-[63px] text-[10px] flex items-center justify-center lg:w-[90px] lg:text-sm"
                >
                  UnlockUser
                </Radio.Button>
              </div>
            </Radio.Group>
          </div>
          {/* 动态表单 */}
          <div className="flex flex-col items-center lg:mt-8 mt-8">
            {(currentAction === "withdraw" ||
              currentAction === "refund" ||
              currentAction === "lockTx" ||
              currentAction === "unlockTx") && (
              <Form.Item<FieldType>
                label="Transaction ID Bytes32"
                name="transactionIdBytes32"
                className="lg:w-[800px] w-[300px] lg:mr-[150px]"
                rules={[
                  {
                    required: true,
                    message: "Please input the transaction id bytes32!",
                  },
                ]}
              >
                <Input
                  className=""
                  placeholder={
                    currentAction === "lockTx" || currentAction === "unlockTx"
                      ? "Transaction ID Bytes32"
                      : "Transaction ID Bytes32 01,Transaction ID Bytes32 02"
                  }
                />
              </Form.Item>
            )}
            {(currentAction === "lockUser" ||
              currentAction === "unlockUser") && (
              <Form.Item<FieldType>
                label="Address"
                name="address"
                className="lg:w-[800px] w-[300px] lg:mr-[240px]"
                rules={[
                  {
                    required: true,
                    message: "Please input the address!",
                  },
                ]}
              >
                <Input className="" placeholder="address" />
              </Form.Item>
            )}
            {currentAction === "refund" && (
              <div className="flex justify-center flex-col">
                <Form.Item<FieldType>
                  label="Pay Method"
                  name="payMethod"
                  className="lg:w-[800px] w-[300px] lg:mr-[90px]"
                  rules={[
                    {
                      required: true,
                      message: "Please select your payMethod!",
                    },
                  ]}
                >
                  <Select defaultValue="0">
                    <Option value="0">contract</Option>
                    <Option value="1">self</Option>
                  </Select>
                </Form.Item>
                <Form.Item<FieldType>
                  label="Amount"
                  name="amount"
                  className="lg:w-[800px] w-[300px] lg:mr-[150px]"
                >
                  <Input placeholder="amount 01,amount 02" />
                </Form.Item>
              </div>
            )}
            {currentAction === "withdraw" && (
              <Form.Item<FieldType>
                label="Receiving Address"
                name="receivingAddress"
                className="lg:w-[800px] w-[300px] lg:mr-[150px]"
                rules={[
                  {
                    required: true,
                    message: "Please input your receiving address!",
                  },
                ]}
              >
                <Input className="" />
              </Form.Item>
            )}
          </div>

          <div className="flex justify-center flex-col items-center">
            <span>tx: {txHash}</span>
            {currentAction === "order" ? (
              <span>transactionIdBytes32: {txIdBytes32}</span>
            ) : null}
          </div>
          <div className="flex justify-center mt-4">
            <Form.Item className="lg:hidden">
              <Button type="primary" htmlType="submit">
                Submit ({currentAction})
              </Button>
            </Form.Item>
          </div>
          <Form.Item
            style={{
              position: "absolute",
              bottom: -60,
              right: 200,
            }}
            className="lg:block hidden"
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
