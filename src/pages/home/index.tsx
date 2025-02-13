import Navigate from "@/components/home/navigate";
import type { FormProps } from "antd";
import { Button, Form, Input, message, Select } from "antd";
import { ethers } from "ethers";
import { useState, useEffect } from "react";
import { useWalletClient, useConfig, useReadContract, useAccount } from "wagmi";
import { writeContract } from "wagmi/actions";
import { abi } from "@/config/EchoooMallPayment.json";
import { abi as erc20Abi } from "@/config/Erc20.json";
import { useLocation } from "react-router-dom";
import { isAddress } from 'ethers/lib/utils';
import { token } from "@/config/token";

type FieldType = {
  transactionIdBytes32?: string;
  receivingAddress?: string;
  currency?: string;
  totalAmount?: string;
  actualAmount?: string;
  merchanAddress?: string;
  address?: string;
  transactionId?: string;
};

const { Option } = Select;

export default function Index() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const [form] = Form.useForm();
  const { data: walletClient } = useWalletClient();
  const config = useConfig();
  const [currentAction] = useState("order"); // 当前操作类型
  const [txHash, setTxHash] = useState<string>("");
  const [showOk, setShowOk] = useState<boolean>(true)

  const { address, chain } = useAccount();
  const [selectedCurrency, setSelectedCurrency] = useState("USDC");

  // 根据 chain.id 获取合约地址
  const chainId = chain?.id.toString();
  const contracts = chainId ? token[chainId as keyof typeof token] : null;
  const echoooMallPaymentAddress = contracts?.EchoooMallPayment?.address;
  const tokenAddress = contracts?.[selectedCurrency as keyof typeof contracts]?.address;
  // @ts-ignore
  const tokenDecimals = contracts?.[selectedCurrency as keyof typeof contracts]?.decimal || 6;

  // 使用 hook 方式获取授权数量
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "allowance",
    args: [address, echoooMallPaymentAddress],
  });

  // 获取 txId 从 URL 参数
  const txId = queryParams.get("txId") || "";

  // 查询当前订单是否已经提交过
  const { data: orderDetails, refetch: refetchOrderDetails } = useReadContract({
    address: echoooMallPaymentAddress as `0x${string}`,
    abi,
    functionName: "getOrderDetails",
    args: [txId],
    // enabled: Boolean(echoooMallPaymentAddress && txId), // 只在地址和txId存在时启用
  });

  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    try {
      if(!showOk) return
      setShowOk(false)
      
      // 同时重新获取两个数据
      await Promise.all([
        refetchAllowance(),
        refetchOrderDetails()
      ]);

      if (!walletClient) {
        console.error("No wallet client found.");
        return;
      }

      // 检查网络是否支持
      if (!chainId || !contracts) {
        message.error("Current network not supported!");
        return;
      }

      // 检查订单是否已提交
      if (orderDetails && Number((orderDetails as any).timestamp) > 0) {
        message.error("This order has already been submitted!");
        setShowOk(true);
        return;
      }

      if(Number(values.totalAmount) < Number(values.actualAmount)) {
        message.error("Abnormal amount!");
        return;
      }
      console.log("allowance:", allowance)
      const requiredAmount = ethers.utils.parseUnits(String(values.actualAmount), tokenDecimals);
      const allowanceBN = ethers.BigNumber.from(allowance || 0);
      
      // 检查 allowance 是否存在且小于所需金额
      if (allowance === undefined) {
        message.error("Failed to check allowance!");
        return;
      }
      if (allowanceBN.lt(requiredAmount)) {
        const approveTx = await writeContract(config, {
          address: tokenAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: "approve",
          args: [
            echoooMallPaymentAddress,
            requiredAmount,
          ],
        });
        console.log("approveTx:", approveTx);
      }
      const txPay = await writeContract(config, {
        address: echoooMallPaymentAddress as `0x${string}`,
        abi,
        functionName: "placeOrder",
        args: [
          values.transactionId,
          tokenAddress,
          ethers.utils.parseUnits(String(values.totalAmount), tokenDecimals),
          ethers.utils.parseUnits(String(values.actualAmount), tokenDecimals),
          values.merchanAddress,
        ],
      });
      setTxHash(txPay);
      setShowOk(true)
      message.success("Order placed successfully!");
    } catch (error) {
      setShowOk(true)
      message.error("Transaction error!");
      console.error(error);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      form.setFieldsValue({
        transactionId: queryParams.get("txId"),
        actualAmount: queryParams.get("actualAmount"),
        merchanAddress: queryParams.get("merchantAdd"),
        totalAmount: queryParams.get("totalAmount"),
      });
    }, 100);
  }, []);

  const validateTxId = (_: any, value: string) => {
    if (!value) {
      return Promise.reject('Transaction ID is required!');
    }
    // 检查是否为32字节的十六进制字符串（0x + 64个字符）
    if (!/^0x[0-9a-fA-F]{64}$/.test(value)) {
      return Promise.reject('Transaction ID must be a 32-byte hex string!');
    }
    return Promise.resolve();
  };

  const validateAmount = (_: any, value: string) => {
    if (!value) {
      return Promise.reject('Amount is required!');
    }
    // 检查是否为有效数字，且大于0
    if (isNaN(Number(value)) || Number(value) <= 0) {
      return Promise.reject('Please enter a valid positive number!');
    }
    // 检查小数位数不超过6位
    if (value.includes('.') && value.split('.')[1].length > 6) {
      return Promise.reject('Maximum 6 decimal places allowed!');
    }
    return Promise.resolve();
  };

  const validateAddress = (_: any, value: string) => {
    if (!value) {
      return Promise.reject('Address is required!');
    }
    if (!isAddress(value)) {
      return Promise.reject('Please enter a valid Ethereum address!');
    }
    return Promise.resolve();
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <Navigate />
      <div className="container mx-auto px-4 py-10 lg:mt-20 mt-10">
        <Form
          form={form}
          name="basic"
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 18 }}
          className="max-w-2xl mx-auto"
          onFinish={onFinish}
          initialValues={{ currency: "USDC" }}
          autoComplete="off"
        >
          {currentAction === "order" && (
            <div className="space-y-4">
              <Form.Item<FieldType>
                label="Currency"
                name="currency"
                rules={[]}
              >
                <Select onChange={(value) => setSelectedCurrency(value)}>
                  <Option value="USDC">USDC</Option>
                  <Option value="USDT">USDT</Option>
                </Select>
              </Form.Item>

              <Form.Item<FieldType>
                label="Transaction ID"
                name="transactionId"
                rules={[{ validator: validateTxId }]}
              >
                <Input
                  disabled
                  className="!bg-gray-50 !text-gray-500 cursor-not-allowed"
                />
              </Form.Item>

              <Form.Item<FieldType>
                label="Total Amount"
                name="totalAmount"
                rules={[{ validator: validateAmount }]}
              >
                <Input
                  disabled
                  className="!bg-gray-50 !text-gray-500 cursor-not-allowed"
                />
              </Form.Item>

              <Form.Item<FieldType>
                label="Actual Amount"
                name="actualAmount"
                rules={[{ validator: validateAmount }]}
              >
                <Input
                  disabled
                  className="!bg-gray-50 !text-gray-500 cursor-not-allowed"
                />
              </Form.Item>

              <Form.Item<FieldType>
                label="Merchant Address"
                name="merchanAddress"
                rules={[{ validator: validateAddress }]}
              >
                <Input
                  disabled
                  className="!bg-gray-50 !text-gray-500 cursor-not-allowed"
                />
              </Form.Item>
            </div>
          )}

          {/* Transaction Hash Display */}
          {txHash && (
            <div className="text-end my-4">
              <span className="text-gray-400">tx: {txHash}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end mt-8">
            <Button type={showOk ? "primary" : "default"} htmlType="submit" className="w-[100px]">
              Ok
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}
