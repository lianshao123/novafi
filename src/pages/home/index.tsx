import Navigate from "@/components/home/navigate";
import type { FormProps } from "antd";
import { Button, Form, Input, Radio, Select } from "antd";
import { ethers } from "ethers";
import { useState } from "react";
import { useAccount, useWalletClient, useConfig } from "wagmi";
import { writeContract } from "wagmi/actions";
import {abi} from "@/config/EchoooMallPayment.json"
import { abi as erc20Abi } from "@/config/Erc20.json"

type FieldType = {
  transactionId?: string; // 交易 id
  amount?: string; // 交易数量
  merchanAddress?: string; // 商户地址
  receivingAddress?: string; // 接收地址
  currency?: string; // 选择的币种
};

const { Option } = Select;

const echoooMallPaymentAddress = "0x9fBe233D9B8E7f06a5ca7c9f680c473091B46001"
const USDCAddress = "0xA3799376C9C71a02e9b79369B929654B037a410D"

// const approveAbi = [
//   "function approve(address spender, uint256 amount) public returns (bool)"
// ];



export default function Index() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const config = useConfig();
  const [isWithdraw, setIsWithdraw] = useState(false); // 状态：是否为“提取资金”
  const [txHash, setTxHash] = useState<string>("")

  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    console.log("values=======", values);
    
    if (!walletClient) {
      console.error("No wallet client found.");
      return;
    }
    console.log("walletClient.chain.rpcUrls.default.http[0]=======", walletClient.chain.rpcUrls.default.http[0]);
    const tx = await writeContract(config, {
      address: USDCAddress,       // ERC20 合约地址
      abi: erc20Abi,                  // ERC20 合约 ABI
      functionName: "approve",        // 要调用的方法
      args: [echoooMallPaymentAddress, ethers.utils.parseUnits(String(values.amount), 18)], // 方法参数
    });

    console.log("Transaction sent:", tx);
    const transactionId = ethers.utils.formatBytes32String(String(values.transactionId));  // TODO
    const txPay = await writeContract(config, {
      address: echoooMallPaymentAddress,       // ERC20 合约地址
      abi,                  // ERC20 合约 ABI
      functionName: "placeOrder",        // 要调用的方法
      args: [transactionId, USDCAddress, ethers.utils.parseUnits(String(values.amount), 18), values.merchanAddress ], // 方法参数
    });
    console.log("txPay==========", txPay);
    setTxHash(txPay)
    // 等待交易完成
    // const receipt = await tx.wait();
    // 创建一个 Ethers.js 的 Provider 和 Signer
    // const provider = new ethers.BrowserProvider(walletClient);
    // const provider = new ethers.providers.Web3Provider(
    //   walletClient.provider as any
    // );
    // const signer = await provider.getSigner();
    // console.log("signer=======", signer);
    // // const signer = new ethers.Web3Provider(provider).getSigner(address);

    // // 创建 ERC20 合约实例
    // const erc20Contract = new ethers.Contract(USDCAddress, approveAbi, signer);
    // // const transactionId = ethers.utils.formatBytes32String("tx3");
    // // console.log("transactionId======", transactionId);
    // console.log("address======", address);
    console.log("Success:", values);
  };
  
  const onFinishFailed: FormProps<FieldType>["onFinishFailed"] = (errorInfo) => {
    console.log("address==2====", address);
    console.log("walletClient==2====", walletClient);
    console.log("Failed:", errorInfo);
  };

  return (
    <div className="flex flex-col w-screen h-screen bg-[#f7f9fb]">
      <Navigate />
      <div className="flex justify-center mt-20 flex-col">
        <Form
          name="basic"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          style={{ maxWidth: 1000, position: "relative" }}
          initialValues={{
            remember: true,
            currency: "USDC", // 默认币种为 USDC
          }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
        >
          {/* 切换模式按钮，放在左上角 */}
          <Radio.Group
            onChange={(e) => setIsWithdraw(e.target.value === "withdraw")}
            value={isWithdraw ? "withdraw" : "order"}
            style={{
              position: "absolute",
              top: -40,
              left: 200,
            }}
          >
            <Radio.Button value="order">Order</Radio.Button>
            <Radio.Button value="withdraw">Withdraw</Radio.Button>
          </Radio.Group>
          {/* 动态表单 */}
          {isWithdraw ? (
            <>
              <Form.Item<FieldType>
                label="Transaction ID"
                name="transactionId"
                rules={[
                  {
                    required: true,
                    message: "Please input your transaction id!",
                  },
                ]}
              >
                <Input className="ml-16" />
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
          ) : (
            <>
              <Form.Item<FieldType>
                label="Transaction ID"
                name="transactionId"
                rules={[
                  {
                    required: false,
                    message: "Please input your transaction id!",
                  },
                ]}
              >
                <Input className="ml-16" />
              </Form.Item>
              {/* 新增币种选择 */}
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
              <div className="flex justify-center">
                <span>tx: {txHash}</span>
              </div>
            </>
          )}
          {/* 提交按钮，放在右下角 */}
          <Form.Item
            label={null}
            style={{
              position: "absolute",
              bottom: -60,
              right: 0,
            }}
          >
            <Button type="primary" htmlType="submit">
              {isWithdraw ? "Withdraw" : "Submit"}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
