import Navigate from "@/components/home/navigate";
import type { FormProps } from "antd";
import { Button, Form, Input, message, Select } from "antd";
import { ethers } from "ethers";
import { useState, useEffect } from "react";
import { useWalletClient, useConfig } from "wagmi";
import { writeContract } from "wagmi/actions";
import { abi } from "@/config/EchoooMallPayment.json";
import { abi as erc20Abi } from "@/config/Erc20.json";
import { useLocation } from "react-router-dom";

type FieldType = {
  transactionIdBytes32?: string;
  receivingAddress?: string;
  currency?: string;
  amount?: string;
  merchanAddress?: string;
  address?: string;
  transactionId?: string;
};

const { Option } = Select;

const echoooMallPaymentAddress = "0x0A9901653413432F193a4397293667ebDEFc9da9";
const USDCAddress = "0xA3799376C9C71a02e9b79369B929654B037a410D";

export default function Index() {
  // const { transactionId, amount, merchatAddress } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const [form] = Form.useForm();
  const { data: walletClient } = useWalletClient();
  const config = useConfig();
  const [currentAction] = useState("order"); // 当前操作类型
  const [txHash, setTxHash] = useState<string>("");

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
        
        const txPay = await writeContract(config, {
          address: echoooMallPaymentAddress,
          abi,
          functionName: "placeOrder",
          args: [
            values.transactionId,
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
    setTimeout(() => {
      form.setFieldsValue({ transactionId: queryParams.get("txId"), amount: queryParams.get("amount"), merchanAddress: queryParams.get("merchantAdd") });
    }, 100);
  },[])

  useEffect(() => {
    form.resetFields(); // 清空表单
    setTxHash("");
  }, [currentAction]);

  return (
    <div className="flex flex-col w-screen h-screen bg-[#f7f9fb]">
      <Navigate />
      <div className="flex justify-center mt-20 flex-col items-center">
        <Form
          form={form}
          name="basic"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          className="lg:w-[800px] w-[300px]"
          style={{ position: "relative"}} 
          initialValues={{ currency: "USDC" }}
          onFinish={onFinish}
          autoComplete="off"
        >
          <div className="flex flex-col items-center">
            {currentAction === "order" && (
              <>
                <div className="flex justify-center">
                  <Form.Item<FieldType>
                    label="Currency"
                    name="currency"
                    className="lg:w-[800px] w-[300px] lg:mr-[90px]"
                    rules={[
                      {
                        required: true,
                        message: "Please select your currency!",
                      },
                    ]}
                  >
                    <Select>
                      <Option value="USDC">USDC</Option>
                    </Select>
                  </Form.Item>
                </div>
                <Form.Item<FieldType>
                  label="Transaction ID"
                  name="transactionId"
                  className="lg:w-[800px] w-[300px] lg:mr-[90px]"
                >
                  <Input readOnly style={{ backgroundColor: "#f5f5f5", color: "#888" }}/>
                </Form.Item>
                <Form.Item<FieldType>
                  label="Amount"
                  name="amount"
                  className="lg:w-[800px] w-[300px] lg:mr-[90px]"
                  rules={[
                    {
                      required: true,
                      message: "Please input the transaction amount!",
                    },
                  ]}
                >
                  <Input readOnly style={{ backgroundColor: "#f5f5f5", color: "#888" }}/>
                </Form.Item>
                <Form.Item<FieldType>
                  label="Merchant Address"
                  name="merchanAddress"
                  className="lg:w-[800px] w-[300px] lg:mr-[90px]"
                  rules={[
                    {
                      required: true,
                      message: "Please input the merchant address!",
                    },
                  ]}
                >
                  <Input readOnly style={{ backgroundColor: "#f5f5f5", color: "#888" }}/>
                </Form.Item>
              </>
            )}

            <div className="flex justify-center flex-col w-screen items-center">
              <span>tx: {txHash}</span>
            </div>
            <Form.Item
              style={{
                position: "absolute",
                bottom: -80,
                right: 28,
              }}
            >
              <Button type="primary" htmlType="submit">
                Submit ({currentAction})
              </Button>
            </Form.Item>
          </div>
        </Form>
      </div>
    </div>
  );
}
