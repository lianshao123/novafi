/*
 * @Author: peng 1063629816@qq.com
 * @Date: 2025-02-13 19:26:47
 * @LastEditors: peng 1063629816@qq.com
 * @LastEditTime: 2025-02-13 19:27:20
 * @FilePath: /novafi-front/novafi/src/utils/validators.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { ethers } from "ethers";

// 验证多个 Transaction IDs
export const validateTransactionIds = (_: any, value: string) => {
  if (!value || !value.trim()) {
    return Promise.reject("Transaction IDs are required!");
  }
  const ids = value.split(",");
  if (ids.length === 0) {
    return Promise.reject("At least one Transaction ID is required!");
  }
  for (const id of ids) {
    if (!id.trim()) {
      return Promise.reject("Empty Transaction ID is not allowed!");
    }
    if (!/^0x[0-9a-fA-F]{64}$/.test(id.trim())) {
      return Promise.reject("Each Transaction ID must be a 32-byte hex string!");
    }
  }
  return Promise.resolve();
};

// 验证单个 Transaction ID
export const validateSingleTransactionId = (_: any, value: string) => {
  if (!value || !value.trim()) {
    return Promise.reject("Transaction ID is required!");
  }
  if (!/^0x[0-9a-fA-F]{64}$/.test(value.trim())) {
    return Promise.reject("Transaction ID must be a 32-byte hex string!");
  }
  return Promise.resolve();
};

// 验证金额
export const validateAmounts = (_: any, value: string) => {
  if (!value || !value.trim()) {
    return Promise.reject("Amounts are required!");
  }
  const amounts = value.split(",");
  if (amounts.length === 0) {
    return Promise.reject("At least one amount is required!");
  }
  for (const amount of amounts) {
    if (!amount.trim()) {
      return Promise.reject("Empty amount is not allowed!");
    }
    if (isNaN(Number(amount.trim())) || Number(amount.trim()) <= 0) {
      return Promise.reject("Each amount must be a valid positive number!");
    }
  }
  return Promise.resolve();
};

// 验证钱包地址
export const validateAddress = (_: any, value: string) => {
  if (!value || !value.trim()) {
    return Promise.reject("Address is required!");
  }
  if (!ethers.utils.isAddress(value.trim())) {
    return Promise.reject("Please enter a valid wallet address!");
  }
  return Promise.resolve();
}; 