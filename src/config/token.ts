/*
 * @Author: peng 1063629816@qq.com
 * @Date: 2025-02-12 13:47:31
 * @LastEditors: peng 1063629816@qq.com
 * @LastEditTime: 2025-02-13 18:47:29
 * @FilePath: /novafi-front/novafi/src/config/token.ts
 * @Description: 支持的token信息
 */
export const token = {
  "42161": {
    USDC: {
      address: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
      decimal: 6,
    },
    USDT: {
      address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
      decimal: 6,
    },
    ETH: {
      address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      decimal: 18,
    },
    EchoooMallPayment: {
      address: "0xf97f3BAaaa361D54DF2ff88499a1f166282A7096",
    }
  },
  "10": {
    USDC: {
      address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", // 主网
      decimal: 6,
    },
    USDT: {
      address: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
      decimal: 6,
    },
    ETH: {
      address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      decimal: 18,
    },
    EchoooMallPayment: {
      address: "0x7510a7Af4B149fB409f1282d466d7209918f5eC5",
    }
  },
  "137": {
    USDC: {
      address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      decimal: 6,
    },
    USDT: {
      address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
      decimal: 6,
    },
    EchoooMallPayment: {
      address: "0x637306B0A13A7A81604B8A11953594034470a368",
    } 
  }
};

// 测试环境
export const tokenTest = {
  "42161": {
    USDC: {
      address: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
      decimal: 6,
    },
    USDT: {
      address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
      decimal: 6,
    },
    ETH: {
      address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      decimal: 18,
    },
    EchoooMallPayment: {
      address: "0xf97f3BAaaa361D54DF2ff88499a1f166282A7096",
    }
  },
  "10": {
    USDC: {
      address: "0xA3799376C9C71a02e9b79369B929654B037a410D",  //测试
      decimal: 6,
    },
    USDT: {
      address: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
      decimal: 6,
    },
    ETH: {
      address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      decimal: 18,
    },
    EchoooMallPayment: {
      address: "0x7510a7Af4B149fB409f1282d466d7209918f5eC5",
    }
  },
  "137": {
    USDC: {
      address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      decimal: 6,
    },
    USDT: {
      address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
      decimal: 6,
    },
    EchoooMallPayment: {
      address: "0x637306B0A13A7A81604B8A11953594034470a368",
    } 
  }
};
