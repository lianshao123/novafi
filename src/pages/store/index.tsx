import Navigate from "@/components/home/navigate";
import type { FormProps } from "antd";
import { Button, Form, Input, message, Radio, Select, List, Modal } from "antd";
import { ethers } from "ethers";
import { useState, useEffect } from "react";
import {
  useWalletClient,
  useConfig,
  useAccount,
  useReadContract as readContract,
} from "wagmi";
import { writeContract } from "wagmi/actions";
import { abi } from "@/config/EchoooMallPayment.json";
import { abi as erc20Abi } from "@/config/Erc20.json";
import { formatTimestamp } from "@/utils/formatTime";
import { token } from "@/config/token";

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

// 添加按钮配置数组
const actionButtons = [
  { value: "withdraw", label: "Withdraw" },
  { value: "refund", label: "Refund" },
  { value: "lockTx", label: "LockTx" },
  { value: "unlockTx", label: "UnlockTx" },
  { value: "lockUser", label: "LockUser" },
  { value: "unlockUser", label: "UnlockUser" },
  { value: "detail", label: "Detail" },
];

interface OrderDetails {
  user: string;
  token: string;
  totalAmount: string;
  paidAmount: string;
  paymentAddress: string;
  timestamp: string;
  refundedAmount: string;
  isWithdrawn: boolean;
  isRefunded: boolean;
  isLocked: boolean;
}

// 添加一个辅助函数来获取代币小数位数
const getTokenDecimals = (tokenAddress: string): number => {
  for (const chainTokens of Object.values(token)) {
    for (const info of Object.values(chainTokens)) {
      if (
        "address" in info &&
        "decimal" in info &&
        info.address.toLowerCase() === tokenAddress.toLowerCase()
      ) {
        return info.decimal;
      }
    }
  }
  return 6;
};

// 添加验证函数
const validateTransactionIds = (_: any, value: string) => {
  if (!value || !value.trim()) {
    return Promise.reject('Transaction IDs are required!');
  }
  const ids = value.split(',');
  if (ids.length === 0) {
    return Promise.reject('At least one Transaction ID is required!');
  }
  for (const id of ids) {
    if (!id.trim()) {
      return Promise.reject('Empty Transaction ID is not allowed!');
    }
    if (!/^0x[0-9a-fA-F]{64}$/.test(id.trim())) {
      return Promise.reject('Each Transaction ID must be a 32-byte hex string!');
    }
  }
  return Promise.resolve();
};

const validateAmounts = (_: any, value: string) => {
  if (!value || !value.trim()) {
    return Promise.reject('Amounts are required!');
  }
  const amounts = value.split(',');
  if (amounts.length === 0) {
    return Promise.reject('At least one amount is required!');
  }
  for (const amount of amounts) {
    if (!amount.trim()) {
      return Promise.reject('Empty amount is not allowed!');
    }
    if (isNaN(Number(amount.trim())) || Number(amount.trim()) <= 0) {
      return Promise.reject('Each amount must be a valid positive number!');

    }
  }
  return Promise.resolve();
};

// 验证钱包地址
const validateAddress = (_: any, value: string) => {
  if (!value || !value.trim()) {
    return Promise.reject('Address is required!');
  }
  if (!ethers.utils.isAddress(value.trim())) {
    return Promise.reject('Please enter a valid wallet address!');
  }
  return Promise.resolve();
};

// 验证单个 Transaction ID
const validateSingleTransactionId = (_: any, value: string) => {
  if (!value || !value.trim()) {
    return Promise.reject('Transaction ID is required!');
  }
  if (!/^0x[0-9a-fA-F]{64}$/.test(value.trim())) {
    return Promise.reject('Transaction ID must be a 32-byte hex string!');
  }
  return Promise.resolve();
};

export default function Index() {
  const [form] = Form.useForm();
  const { data: walletClient } = useWalletClient();
  const config = useConfig();
  const [currentAction, setCurrentAction] = useState("withdraw"); // 当前操作类型
  const [txHash, setTxHash] = useState<string>("");
  const { address, chain } = useAccount();
  const [orderData, setOrderData] = useState<any[]>([]);
  const [txId, setTxId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 根据 chain.id 获取合约地址
  const chainId = chain?.id.toString();
  const contracts = chainId ? token[chainId as keyof typeof token] : null;
  const echoooMallPaymentAddress = contracts?.EchoooMallPayment?.address;

  // 合约调用的读取钩子，避免在外部函数中调用
  const { data } = readContract({
    address: echoooMallPaymentAddress as `0x${string}`,
    abi: abi,
    functionName: "getMerchantOrders",
    args: [address],
  });

  const {
    data: detailData,
    isLoading: detailIsLoading,
    isError: detailIsError,
  } = readContract({
    address: echoooMallPaymentAddress as `0x${string}`,
    abi: abi,
    functionName: "getOrderDetails",
    args: [txId],
  });

  // 获取订单详情的函数
  const getOrderDetails = async (txId: string) => {
    try {
      if (!window.ethereum) {
        throw new Error("No ethereum provider found");
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);

      // 确保 provider 连接到正确的网络
      const network = await provider.getNetwork();
      if (network.chainId.toString() !== chainId) {
        throw new Error("Wrong network");
      }

      // 创建合约实例
      const contract = new ethers.Contract(
        echoooMallPaymentAddress as string,
        abi,
        provider
      );

      // 调用合约方法
      const details = (await contract.getOrderDetails(txId)) as OrderDetails;
      return {
        user: details.user,
        token: details.token,
        totalAmount: details.totalAmount.toString(),
        paidAmount: details.paidAmount.toString(),
        paymentAddress: details.paymentAddress,
        timestamp: details.timestamp.toString(),
        refundedAmount: details.refundedAmount.toString(),
        isWithdrawn: details.isWithdrawn,
        isRefunded: details.isRefunded,
        isLocked: details.isLocked,
      };
    } catch (error) {
      console.error("Error getting order details:", error);
      message.error(
        "Failed to get order details. Please check your network connection."
      );
      return null;
    }
  };

  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    try {
      if (!walletClient) {
        console.error("No wallet client found.");
        return;
      }
      if (currentAction === "withdraw") {
        const transactionBatch = values.transactionIdBytes32?.split(",");
        const txWithdraw = await writeContract(config, {
          address: echoooMallPaymentAddress as `0x${string}`,
          abi,
          functionName: "withdrawFundsBatch",
          args: [transactionBatch, values.receivingAddress],
        });
        setTxHash(txWithdraw);
        message.success("Withdraw successful!");
      } else if (currentAction === "refund") {
        const transactionBatch = values.transactionIdBytes32?.split(",").map(id => id.trim()) || [];
        const amountArray = values.amount?.split(",").map(amount => amount.trim()) || [];
        
        if (transactionBatch.length !== amountArray.length) {
          message.error("Number of Transaction IDs must match number of amounts!");
          return;
        }

        const orderDetailsPromises = transactionBatch.map(txId => getOrderDetails(txId)) || [];
        const orderDetailsList = await Promise.all(orderDetailsPromises);

        // 按代币地址归集金额
        const tokenAmounts = new Map<string, ethers.BigNumber>();
        let isRefunded = false;
        orderDetailsList.forEach((details, index) => {
          if (!details) return;
          if (details.isRefunded || details.timestamp === "0") return;
          const actualAmount = ethers.BigNumber.from(details.paidAmount).sub(
            ethers.BigNumber.from(details.refundedAmount)
          );
          const decimals = getTokenDecimals(details.token);
          const amount = ethers.utils.parseUnits(
            amountArray[index] || "0",
            decimals
          );
          if (amount.gt(actualAmount)) {
            isRefunded = true;
            return;
          }

          const token = details.token;
          if (tokenAmounts.has(token)) {
            tokenAmounts.set(token, tokenAmounts.get(token)!.add(amount));
          } else {
            tokenAmounts.set(token, amount);
          }
        });

        if (isRefunded) {
          message.error("Refund amount cannot be greater than actual amount");
          return;
        }
        console.log("tokenAmounts:", tokenAmounts.entries());
        if (tokenAmounts.size === 0) {
          message.error("No valid orders found for refund.");
          return;
        }
        // 如果是商户退款，需要对每种代币进行授权
        if (values.payMethod === "1") {
          for (const [tokenAddress, amount] of tokenAmounts) {
            const approveTx = await writeContract(config, {
              address: tokenAddress as `0x${string}`,
              abi: erc20Abi,
              functionName: "approve",
              args: [echoooMallPaymentAddress, amount],
            });
            console.log(`Approve tx for token ${tokenAddress}:`, approveTx);
          }
        }
        // 执行退款
        const amounts = amountArray.map((amount, index) => {
          const details = orderDetailsList[index];
          const decimals = details ? getTokenDecimals(details.token) : 6;
          return ethers.utils.parseUnits(amount.trim(), decimals);
        }) as any[];

        const txRefund = await writeContract(config, {
          address: echoooMallPaymentAddress as `0x${string}`,
          abi,
          functionName: "refundOrdersBatchFromMerchant",
          args: [transactionBatch, amounts, values.payMethod],
        });
        setTxHash(txRefund);
        message.success("Refund successful!");
      } else if (currentAction === "lockTx") {
        const txLock = await writeContract(config, {
          address: echoooMallPaymentAddress as `0x${string}`,
          abi,
          functionName: "lockTransaction",
          args: [values.transactionIdBytes32],
        });
        setTxHash(txLock);
        message.success("Lock Transaction successful!");
      } else if (currentAction === "unlockTx") {
        const txUnlock = await writeContract(config, {
          address: echoooMallPaymentAddress as `0x${string}`,
          abi,
          functionName: "unlockTransaction",
          args: [values.transactionIdBytes32],
        });
        setTxHash(txUnlock);
        message.success("Unlock Transaction successful!");
      } else if (currentAction === "lockUser") {
        const txLockUser = await writeContract(config, {
          address: echoooMallPaymentAddress as `0x${string}`,
          abi,
          functionName: "lockUser",
          args: [values.address],
        });
        setTxHash(txLockUser);
        message.success("Lock User successful!");
      } else if (currentAction === "unlockUser") {
        const txUnlockUser = await writeContract(config, {
          address: echoooMallPaymentAddress as `0x${string}`,
          abi,
          functionName: "unlockUser",
          args: [values.address],
        });
        setTxHash(txUnlockUser);
        message.success("Unlock User successful!");
      }
    } catch (error) {
      message.error("Transaction error!");
      console.error(error);
    }
  };

  useEffect(() => {
    form.resetFields(); // 清空表单
    setTxHash("");
    if (currentAction === "detail") {
      setOrderData(data as string[]);
    } else {
      setOrderData([]); // 其他操作时清空数据
    }
  }, [currentAction]);

  useEffect(() => {
    if (address) {
      form.setFieldsValue({ receivingAddress: address });
    }
  }, [address, form]);

  const showTxDetail = (txId: string) => {
    setTxId(txId);
    setIsModalOpen(true);
  };

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
            >
              <div className="flex">
                {actionButtons.map((button) => (
                  <Radio.Button
                    key={button.value}
                    value={button.value}
                    className="w-[63px] text-[10px] flex items-center justify-center lg:w-[90px] lg:text-sm"
                  >
                    {button.label}
                  </Radio.Button>
                ))}
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
                label="Transaction ID"
                name="transactionIdBytes32"
                className="lg:w-[800px] w-[300px] lg:mr-[150px]"
                rules={[
                  { 
                    validator: currentAction === "withdraw" || currentAction === "refund" 
                      ? validateTransactionIds 
                      : validateSingleTransactionId 
                  },
                  { required: true, message: "" }
                ]}
              >
                <Input
                  className=""
                  placeholder={
                    currentAction === "lockTx" || currentAction === "unlockTx"
                      ? "Transaction ID"
                      : "Transaction ID 01,Transaction ID 02"
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
                  { validator: validateAddress },
                  { required: true, message: "" }
                ]}
              >
                <Input placeholder="address" />
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
                  rules={[{ validator: validateAmounts }, { required: true, message: "" } ]}
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
                  { validator: validateAddress },
                  { required: true, message: "" }
                ]}
              >
                <Input className="" placeholder="address" />
              </Form.Item>
            )}
            {currentAction === "detail" && (
              <Form.Item<FieldType>
                name="receivingAddress"
                className="lg:w-[800px] w-[300px] flex justify-center"
              >
                <List
                  bordered
                  className="w-[800px] flex justify-center"
                  dataSource={orderData}
                  renderItem={(item: string, index: number) => (
                    <List.Item>
                      <div
                        className="cursor-pointer hover:underline"
                        onClick={() => {
                          showTxDetail(item);
                        }}
                      >
                        {index}: {item}
                      </div>
                    </List.Item>
                  )}
                />
              </Form.Item>
            )}
          </div>

          <div className="flex justify-center flex-col items-center">
            {currentAction === "detail" ? null : <span>tx: {txHash}</span>}
          </div>
          <div className="flex justify-center mt-4">
            <Form.Item className="lg:hidden">
              <Button type="primary" htmlType="submit">
                Ok
              </Button>
            </Form.Item>
          </div>
          {currentAction === "detail" ? null : (
            <Form.Item
              style={{
                position: "absolute",
                bottom: -60,
                right: 200,
              }}
              className="lg:block hidden"
            >
              <Button type="primary" htmlType="submit">
                Ok
              </Button>
            </Form.Item>
          )}
        </Form>
      </div>
      <Modal
        title="Order Details"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)} // 点击取消关闭弹窗
        footer={null}
      >
        {detailIsLoading ? (
          <p>Loading...</p>
        ) : detailIsError ? (
          <p>Error loading details.</p>
        ) : (
          <div className="flex flex-col items-center">
            <p>user: {(detailData as any).user}</p>
            <p>token: {(detailData as any).token}</p>
            <p>
              totalAmount:{" "}
              {ethers.utils.formatUnits(
                Number((detailData as any).totalAmount),
                6
              )}
            </p>
            <p>
              paidAmount:{" "}
              {ethers.utils.formatUnits(
                Number((detailData as any).paidAmount),
                6
              )}
            </p>
            <p>paymentAddress: {(detailData as any).paymentAddress}</p>
            <p>
              timestamp:{" "}
              {formatTimestamp(Number((detailData as any).timestamp))}
            </p>
            <p>
              refundedAmount:{" "}
              {ethers.utils.formatUnits(
                Number((detailData as any).refundedAmount)
              )}
            </p>
            <p>isWithdrawn: {String((detailData as any).isWithdrawn)}</p>
            <p>isRefunded: {String((detailData as any).isRefunded)}</p>
            <p>isLocked: {String((detailData as any).isLocked)}</p>
          </div>
          // <pre>{JSON.stringify(detailData)}</pre> // 格式化展示 detailData
        )}
      </Modal>
    </div>
  );
}

