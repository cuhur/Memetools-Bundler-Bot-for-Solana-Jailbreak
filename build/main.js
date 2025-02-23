'use strict';

var fs = require('fs');
var path = require('path');
var os = require('os');
var web3_js = require('@solana/web3.js');
var splToken = require('@solana/spl-token');
var searcher_js = require('jito-ts/dist/sdk/block-engine/searcher.js');
var types_js = require('jito-ts/dist/sdk/block-engine/types.js');
var utf8_js = require('@coral-xyz/anchor/dist/cjs/utils/bytes/utf8.js');
var bs583 = require('bs58');
var BN = require('bn.js');
var searcher = require('jito-ts/dist/sdk/block-engine/searcher');
var openbook = require('@openbook-dex/openbook');
var electron = require('electron');
var log = require('electron-log');
var utils = require('@electron-toolkit/utils');
var getPortPlease = require('get-port-please');
var startServer = require('next/dist/server/lib/start-server');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

var fs__default = /*#__PURE__*/_interopDefault(fs);
var path__default = /*#__PURE__*/_interopDefault(path);
var os__default = /*#__PURE__*/_interopDefault(os);
var bs583__default = /*#__PURE__*/_interopDefault(bs583);
var BN__default = /*#__PURE__*/_interopDefault(BN);
var log__default = /*#__PURE__*/_interopDefault(log);

var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// electron/tasks/pump/PUMP_LAYOUT.js
var BondingCurveLayout;
var init_PUMP_LAYOUT = __esm({
  "electron/tasks/pump/PUMP_LAYOUT.js"() {
    "use server";
    BondingCurveLayout = class {
      static serialize(virtualTokenReserves, virtualSolReserves, realTokenReserves, realSolReserves, tokenTotalSupply, complete) {
        const buffer = Buffer.alloc(41);
        buffer.writeBigInt64LE(BigInt(virtualTokenReserves), 0);
        buffer.writeBigInt64LE(BigInt(virtualSolReserves), 8);
        buffer.writeBigInt64LE(BigInt(realTokenReserves), 16);
        buffer.writeBigInt64LE(BigInt(realSolReserves), 24);
        buffer.writeBigInt64LE(BigInt(tokenTotalSupply), 32);
        buffer.writeInt8(complete ? 1 : 0, 40);
        return buffer;
      }
      static deserialize(buffer) {
        return {
          virtualTokenReserves: buffer.readBigInt64LE(0),
          virtualSolReserves: buffer.readBigInt64LE(8),
          realTokenReserves: buffer.readBigInt64LE(16),
          realSolReserves: buffer.readBigInt64LE(24),
          tokenTotalSupply: buffer.readBigInt64LE(32),
          complete: buffer.readInt8(40) !== 0
        };
      }
    };
  }
});
var ErrorLogger;
var init_error_logger = __esm({
  "electron/tasks/pump/error-logger.ts"() {
    ErrorLogger = class {
      constructor() {
        const desktopPath = path__default.default.join(os__default.default.homedir(), "Documents");
        const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").replace("T", "_").split(".")[0];
        const filename = `Memetools_${timestamp}.log`;
        this.logFilePath = path__default.default.join(desktopPath, filename);
        fs__default.default.writeFileSync(this.logFilePath, "");
      }
      log(error, context = "") {
        try {
          const timestamp = (/* @__PURE__ */ new Date()).toISOString();
          const errorMessage = error instanceof Error ? error.stack || error.message : error;
          const logEntry = `[${timestamp}] ${context}
${errorMessage}

`;
          fs__default.default.appendFileSync(this.logFilePath, logEntry);
        } catch (writeError) {
          console.error("Failed to write to log file:", writeError);
        }
      }
      getLogPath() {
        return this.logFilePath;
      }
    };
  }
});
var BumpitTask;
var init_BumpitTask = __esm({
  "electron/tasks/pump/BumpitTask.ts"() {
    init_PUMP_LAYOUT();
    init_error_logger();
    BumpitTask = class {
      constructor() {
        this.connection = null;
        this.stopSignal = false;
        this.transactionCount = 0;
        this.lastUpdate = Date.now();
        this.config = null;
        this.retryDelay = 500;
        this.maxRetryDelay = 5e3;
        this.reset();
        this.errorLogger = new ErrorLogger();
        console.log(`Log file created at: ${this.errorLogger.getLogPath()}`);
      }
      reset() {
        this.connection = null;
        this.stopSignal = false;
        this.transactionCount = 0;
        this.lastUpdate = Date.now();
        this.config = null;
      }
      start(data) {
        return __async(this, null, function* () {
          this.errorLogger.log("Starting Bumpit task...");
          try {
            if (this.connection) {
              throw new Error("Task already running");
            }
            this.config = data;
            this.stopSignal = false;
            this.transactionCount = 0;
            this.connection = new web3_js.Connection(data.rpc, {
              commitment: "confirmed",
              wsEndpoint: data.ws
            });
            yield this.runBumpitLoop();
          } catch (error) {
            this.errorLogger.log(error, "Task Start Failed");
            console.error("Error starting Bumpit task:", error);
            yield this.cleanup();
            throw error;
          }
        });
      }
      stop() {
        return __async(this, null, function* () {
          this.errorLogger.log("Stopping Bumpit task...", "Task Stop");
          try {
            this.stopSignal = true;
            yield new Promise((resolve) => setTimeout(resolve, 100));
            yield this.cleanup();
            this.errorLogger.log("Bumpit task stopped successfully", "Task Stop Success");
          } catch (error) {
            this.errorLogger.log(error, "Task Stop Failed");
            throw error;
          }
        });
      }
      getStats() {
        return {
          transactionCount: this.transactionCount,
          lastUpdate: this.lastUpdate,
          isRunning: !this.stopSignal && this.connection !== null
        };
      }
      cleanup() {
        return __async(this, null, function* () {
          this.connection = null;
          this.config = null;
          this.transactionCount = 0;
          this.lastUpdate = Date.now();
        });
      }
      sleep(ms) {
        return __async(this, null, function* () {
          yield new Promise((resolve) => setTimeout(resolve, ms));
        });
      }
      retryWithBackoff(operation, maxRetries = 5) {
        return __async(this, null, function* () {
          let retries = 0;
          while (true) {
            try {
              return yield operation();
            } catch (error) {
              this.errorLogger.log(error, `Retry attempt ${retries + 1}/${maxRetries}`);
              retries++;
              if (retries >= maxRetries || this.stopSignal) {
                throw error;
              }
              const isRateLimit = error instanceof Error && error.message.includes("429");
              const delay = isRateLimit ? Math.min(this.retryDelay * Math.pow(2, retries), this.maxRetryDelay) : this.retryDelay;
              console.log(`Retrying operation after ${delay}ms delay...`);
              yield this.sleep(delay);
            }
          }
        });
      }
      runBumpitLoop() {
        return __async(this, null, function* () {
          var _a, _b, _c;
          try {
            const PUMP_PROGRAM_ID = new web3_js.PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");
            if (!((_a = this.config) == null ? void 0 : _a.token)) {
              throw new Error("Token is missing in the configuration");
            }
            const contract_address = new web3_js.PublicKey(this.config.token);
            if (!((_b = this.config) == null ? void 0 : _b.rpc)) {
              throw new Error("RPC URL is missing in the configuration");
            }
            const connection = new web3_js.Connection(this.config.rpc);
            const jito_client = ((_c = this.config) == null ? void 0 : _c.antiMEV) ? searcher_js.searcherClient(this.config.jito_config.jitoURL) : null;
            const wallet_keypair = web3_js.Keypair.fromSecretKey(bs583__default.default.decode(this.config.wallets.privateKey));
            const buy_in_lamports = this.config.buyAmount * 1e9;
            const minimum_required = buy_in_lamports + buy_in_lamports * 100 / 100;
            const bonding_curve = web3_js.PublicKey.findProgramAddressSync([utf8_js.encode("bonding-curve"), contract_address.toBuffer()], PUMP_PROGRAM_ID)[0];
            const a_bonding_curve = splToken.getAssociatedTokenAddressSync(contract_address, bonding_curve, true);
            const associated_token_account = splToken.getAssociatedTokenAddressSync(contract_address, wallet_keypair.publicKey, true);
            const ata_instruction = splToken.createAssociatedTokenAccountIdempotentInstruction(wallet_keypair.publicKey, associated_token_account, wallet_keypair.publicKey, contract_address, splToken.TOKEN_PROGRAM_ID, splToken.ASSOCIATED_TOKEN_PROGRAM_ID);
            const priority_instructions = this.config.antiMEV ? [web3_js.SystemProgram.transfer({
              fromPubkey: wallet_keypair.publicKey,
              toPubkey: new web3_js.PublicKey("ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt"),
              lamports: this.config.jito_config.tipAmount * 1e9
            })] : [
              web3_js.ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 35e4 }),
              web3_js.ComputeBudgetProgram.setComputeUnitLimit({ units: 14e4 })
            ];
            while (!this.stopSignal) {
              try {
                const wallet_balance = yield connection.getBalance(wallet_keypair.publicKey);
                if (wallet_balance <= minimum_required) {
                  const error = new Error(`Insufficient balance: ${wallet_balance / 1e9} SOL. Required: ${minimum_required / 1e9} SOL`);
                  this.errorLogger.log(error, "Balance Check Failed");
                  break;
                }
                const amount = BigInt(buy_in_lamports);
                const accountInfo = yield connection.getAccountInfo(bonding_curve);
                if (!accountInfo) {
                  throw new Error("Failed to fetch account info");
                }
                const { virtualSolReserves, virtualTokenReserves } = BondingCurveLayout.deserialize(accountInfo.data.slice(8));
                const max_sol_cost = amount + amount * BigInt(100) / BigInt(100);
                const k = virtualSolReserves * virtualTokenReserves;
                const new_sol_reserves = virtualSolReserves + amount;
                const new_token_reserves = k / new_sol_reserves;
                const tokens_to_receive = virtualTokenReserves - new_token_reserves;
                const BUY_INSTRUCTION_BUFFER = Buffer.from([
                  102,
                  6,
                  61,
                  18,
                  1,
                  218,
                  235,
                  234,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0
                ]);
                BUY_INSTRUCTION_BUFFER.writeBigUInt64LE(BigInt(tokens_to_receive), 8);
                BUY_INSTRUCTION_BUFFER.writeBigUInt64LE(BigInt(max_sol_cost), 16);
                const buy_instruction = new web3_js.TransactionInstruction({
                  programId: PUMP_PROGRAM_ID,
                  keys: [
                    { pubkey: new web3_js.PublicKey("4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf"), isSigner: false, isWritable: false },
                    { pubkey: new web3_js.PublicKey("CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM"), isSigner: false, isWritable: true },
                    { pubkey: contract_address, isSigner: false, isWritable: false },
                    { pubkey: bonding_curve, isSigner: false, isWritable: true },
                    { pubkey: a_bonding_curve, isSigner: false, isWritable: true },
                    { pubkey: associated_token_account, isSigner: false, isWritable: true },
                    { pubkey: wallet_keypair.publicKey, isSigner: true, isWritable: true },
                    { pubkey: web3_js.SystemProgram.programId, isSigner: false, isWritable: false },
                    { pubkey: splToken.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                    { pubkey: web3_js.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
                    { pubkey: new web3_js.PublicKey("Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1"), isSigner: false, isWritable: false },
                    { pubkey: PUMP_PROGRAM_ID, isSigner: false, isWritable: false }
                  ],
                  data: BUY_INSTRUCTION_BUFFER
                });
                const min_sol_output = BigInt(0);
                const SELL_INSTRUCTION_BUFFER = Buffer.from([
                  51,
                  230,
                  133,
                  164,
                  1,
                  127,
                  131,
                  173,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0,
                  0
                ]);
                SELL_INSTRUCTION_BUFFER.writeBigUInt64LE(BigInt(tokens_to_receive), 8);
                SELL_INSTRUCTION_BUFFER.writeBigUInt64LE(min_sol_output, 16);
                const sell_instruction = new web3_js.TransactionInstruction({
                  programId: PUMP_PROGRAM_ID,
                  keys: [
                    { pubkey: new web3_js.PublicKey("4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf"), isSigner: false, isWritable: false },
                    { pubkey: new web3_js.PublicKey("CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM"), isSigner: false, isWritable: true },
                    { pubkey: contract_address, isSigner: false, isWritable: false },
                    { pubkey: bonding_curve, isSigner: false, isWritable: true },
                    { pubkey: a_bonding_curve, isSigner: false, isWritable: true },
                    { pubkey: associated_token_account, isSigner: false, isWritable: true },
                    { pubkey: wallet_keypair.publicKey, isSigner: true, isWritable: true },
                    { pubkey: web3_js.SystemProgram.programId, isSigner: false, isWritable: false },
                    { pubkey: splToken.ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                    { pubkey: splToken.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                    { pubkey: new web3_js.PublicKey("Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1"), isSigner: false, isWritable: false },
                    { pubkey: PUMP_PROGRAM_ID, isSigner: false, isWritable: false }
                  ],
                  data: SELL_INSTRUCTION_BUFFER
                });
                const instructions = [...priority_instructions, ata_instruction, buy_instruction, sell_instruction];
                const { blockhash } = yield connection.getLatestBlockhash("confirmed");
                const transaction = new web3_js.VersionedTransaction(
                  new web3_js.TransactionMessage({
                    payerKey: wallet_keypair.publicKey,
                    recentBlockhash: blockhash,
                    instructions
                  }).compileToV0Message()
                );
                transaction.sign([wallet_keypair]);
                if (this.config.antiMEV) {
                  const bundle = new types_js.Bundle([transaction], 2);
                  try {
                    if (jito_client) {
                      const signature = yield jito_client.sendBundle(bundle);
                      console.log(`Bundle sent: ${signature}`);
                    } else {
                      throw new Error("Jito client is not initialized");
                    }
                  } catch (error) {
                    console.error("Error sending bundle:", error);
                    continue;
                  }
                } else {
                  const signature = yield connection.sendTransaction(transaction, {
                    skipPreflight: true,
                    maxRetries: 5
                  });
                  console.log(`Transaction Sent: https://solscan.io/tx/${signature}`);
                }
                this.transactionCount++;
                this.lastUpdate = Date.now();
                console.log(this.config.delay);
                yield new Promise((resolve) => {
                  var _a2;
                  return setTimeout(resolve, ((_a2 = this.config) == null ? void 0 : _a2.delay) || 2e3);
                });
              } catch (loopError) {
                this.errorLogger.log(loopError, "Loop Iteration Error");
                yield new Promise((resolve) => setTimeout(resolve, 1e3));
              }
            }
          } catch (error) {
            this.errorLogger.log(error, "Fatal Loop Error");
            throw error;
          }
        });
      }
    };
  }
});
function fetchDataAndCalculateAmount(bondingCurve, connection, amount, isBuy, slippage) {
  return __async(this, null, function* () {
    try {
      const accountInfo = yield connection.getAccountInfo(new web3_js.PublicKey(bondingCurve));
      if (!accountInfo) throw new Error("Failed to fetch bonding curve data");
      const { virtualSolReserves, virtualTokenReserves } = BondingCurveLayout.deserialize(accountInfo.data.slice(8));
      const k = new BN__default.default(virtualSolReserves.toString()).mul(new BN__default.default(virtualTokenReserves.toString()));
      if (isBuy) {
        const maxSolCost = new BN__default.default(Math.floor(amount * (1 + slippage) * 1e9));
        const amountLamports = new BN__default.default(Math.floor(amount * 1e9));
        const newSolReserves = new BN__default.default(virtualSolReserves.toString()).add(amountLamports);
        const newTokenAmount = k.div(newSolReserves).add(new BN__default.default(1));
        const tokenAmount = new BN__default.default(virtualTokenReserves.toString()).sub(newTokenAmount);
        return { tokenAmount, maxSolCost };
      } else {
        const sellAmountTokens = new BN__default.default(amount.toString());
        const newTokenReserves = new BN__default.default(virtualTokenReserves.toString()).add(sellAmountTokens);
        const newSolAmount = k.div(newTokenReserves).add(new BN__default.default(1));
        const solToReceive = new BN__default.default(virtualSolReserves.toString()).sub(newSolAmount);
        const minSolOutput = solToReceive.mul(new BN__default.default(1e4 - Math.floor(slippage * 1e4))).div(new BN__default.default(1e4));
        return { sellAmountTokens, minSolOutput };
      }
    } catch (error) {
      console.error("Fetch and Calculate Error:", error);
      throw error;
    }
  });
}
var fetchAndCalculate_default;
var init_fetchAndCalculate = __esm({
  "electron/tasks/pump/utils/fetchAndCalculate.js"() {
    init_PUMP_LAYOUT();
    fetchAndCalculate_default = fetchDataAndCalculateAmount;
  }
});
function createMicroBuyTx(mint, bondingCurve, aBondingCurve, pumpProgramId, walletKeypair, tokenAmount, maxSolCost, ata, ataInstruction, TOKEN_PROGRAM_ID5, use_jito, jito_config, lamports) {
  return __async(this, null, function* () {
    console.log("\n\nCreating Micro Buy Transaction");
    try {
      const transactionBuffer = encodeTransaction(tokenAmount, maxSolCost);
      const swapIn = new web3_js.TransactionInstruction({
        programId: pumpProgramId,
        keys: [
          { pubkey: new web3_js.PublicKey("4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf"), isSigner: false, isWritable: false },
          { pubkey: new web3_js.PublicKey("CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM"), isSigner: false, isWritable: true },
          { pubkey: mint, isSigner: false, isWritable: false },
          { pubkey: bondingCurve, isSigner: false, isWritable: true },
          { pubkey: aBondingCurve, isSigner: false, isWritable: true },
          { pubkey: ata, isSigner: false, isWritable: true },
          { pubkey: walletKeypair.publicKey, isSigner: true, isWritable: true },
          { pubkey: web3_js.SystemProgram.programId, isSigner: false, isWritable: false },
          { pubkey: TOKEN_PROGRAM_ID5, isSigner: false, isWritable: false },
          { pubkey: web3_js.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
          { pubkey: new web3_js.PublicKey("Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1"), isSigner: false, isWritable: false },
          { pubkey: pumpProgramId, isSigner: false, isWritable: false }
        ],
        data: transactionBuffer
      });
      let computePriceIx = web3_js.ComputeBudgetProgram.setComputeUnitPrice({ microLamports: lamports });
      let computeLimitIx = web3_js.ComputeBudgetProgram.setComputeUnitLimit({ units: 12e4 });
      let instructions = [computePriceIx, computeLimitIx, ataInstruction, swapIn];
      if (use_jito) {
        const transferInstruction = web3_js.SystemProgram.transfer({
          fromPubkey: walletKeypair.publicKey,
          toPubkey: new web3_js.PublicKey("ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt"),
          lamports: jito_config.tipAmount * 1e9
        });
        instructions.push(transferInstruction);
      }
      return instructions;
    } catch (error) {
      console.error("Create Micro Buy Transaction Error:", error);
      throw error;
    }
  });
}
function encodeTransaction(tokenAmount, maxSolCost) {
  const opcode = Buffer.from([102]);
  const constantPrefix = Buffer.from("063d1201daebea", "hex");
  const encodedAmount = encodeU64(tokenAmount);
  const encodedMaxSolCost = encodeU64(maxSolCost);
  return Buffer.concat([opcode, constantPrefix, encodedAmount, encodedMaxSolCost]);
}
function encodeU64(value) {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64LE(BigInt(value.toString()), 0);
  return buffer;
}
var createMicroBuyTx_default;
var init_createMicroBuyTx = __esm({
  "electron/tasks/pump/transactions/createMicroBuyTx.js"() {
    createMicroBuyTx_default = createMicroBuyTx;
  }
});
var VolumeTask;
var init_VolumeTask = __esm({
  "electron/tasks/pump/VolumeTask.ts"() {
    init_fetchAndCalculate();
    init_createMicroBuyTx();
    VolumeTask = class {
      constructor() {
        this.connection = null;
        this.stopSignal = false;
        this.transactionCount = 0;
        this.lastUpdate = Date.now();
        this.config = null;
        this.reset();
      }
      reset() {
        this.connection = null;
        this.stopSignal = false;
        this.transactionCount = 0;
        this.lastUpdate = Date.now();
        this.config = null;
      }
      start(data) {
        return __async(this, null, function* () {
          console.log("Starting Volume task...");
          try {
            if (this.connection) {
              throw new Error("Task already running");
            }
            this.config = data;
            this.stopSignal = false;
            this.transactionCount = 0;
            this.connection = new web3_js.Connection(data.rpc, {
              commitment: "confirmed",
              wsEndpoint: data.ws
            });
            yield this.runVolumeLoop();
          } catch (error) {
            console.error("Error starting Volume task:", error);
            yield this.cleanup();
            throw error;
          }
        });
      }
      stop() {
        return __async(this, null, function* () {
          console.log("Stopping Volume task...");
          try {
            this.stopSignal = true;
            yield new Promise((resolve) => setTimeout(resolve, 100));
            yield this.cleanup();
            console.log("Volume task stopped successfully");
          } catch (error) {
            console.error("Error stopping Volume task:", error);
            throw error;
          }
        });
      }
      getStats() {
        return {
          transactionCount: this.transactionCount,
          lastUpdate: this.lastUpdate,
          isRunning: !this.stopSignal && this.connection !== null
        };
      }
      cleanup() {
        return __async(this, null, function* () {
          this.connection = null;
          this.config = null;
          this.transactionCount = 0;
          this.lastUpdate = Date.now();
        });
      }
      sleep(ms) {
        return __async(this, null, function* () {
          yield new Promise((resolve) => setTimeout(resolve, ms));
        });
      }
      runVolumeLoop() {
        return __async(this, null, function* () {
          var _a;
          if (!this.config) throw new Error("Config is null");
          const wallets = this.config.wallets.map((wallet) => {
            return {
              privKey: wallet.privateKey,
              pubKey: wallet.publicKey
            };
          });
          if (!this.config || !this.connection) throw new Error("Volume task not properly initialized");
          try {
            const jito_client = this.config.antiMEV ? searcher.searcherClient(((_a = this.config.jito_config) == null ? void 0 : _a.jitoURL) || "") : null;
            const connection = new web3_js.Connection(this.config.rpc, { commitment: "confirmed", wsEndpoint: this.config.ws });
            const PUMP_PROGRAM_ID = new web3_js.PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");
            const mintPubKey = new web3_js.PublicKey(this.config.token);
            const bondingCurve = web3_js.PublicKey.findProgramAddressSync(
              [utf8_js.encode("bonding-curve"), mintPubKey.toBuffer()],
              PUMP_PROGRAM_ID
            )[0];
            const aBondingCurve = splToken.getAssociatedTokenAddressSync(mintPubKey, bondingCurve, true);
            while (!this.stopSignal) {
              for (const wallet of wallets) {
                if (this.stopSignal) break;
                try {
                  console.log("New Wallet: ", wallet.pubKey);
                  const wallet_solana_balance = (yield connection.getBalance(new web3_js.PublicKey(wallet.pubKey))) / 1e9;
                  if (wallet_solana_balance <= 1e-4) {
                    console.log("Wallet balance too low, skipping");
                    continue;
                  }
                  const walletKeypair = web3_js.Keypair.fromSecretKey(bs583__default.default.decode(wallet.privKey));
                  const ata = splToken.getAssociatedTokenAddressSync(mintPubKey, walletKeypair.publicKey, true);
                  const ataInstruction = splToken.createAssociatedTokenAccountIdempotentInstruction(
                    walletKeypair.publicKey,
                    ata,
                    walletKeypair.publicKey,
                    mintPubKey
                  );
                  const minBuy = this.config.minBuy || 5e-4;
                  const maxBuy = this.config.maxBuy || 1e-3;
                  const amount = Math.random() * (maxBuy - minBuy) + minBuy;
                  const { tokenAmount, maxSolCost } = yield fetchAndCalculate_default(
                    bondingCurve,
                    connection,
                    amount,
                    true,
                    this.config.slippage || 0.1
                  );
                  const lamports = 1e-6 * web3_js.LAMPORTS_PER_SOL;
                  const microLamports = lamports * 1e3;
                  const transaction_instructions = yield createMicroBuyTx_default(
                    mintPubKey,
                    bondingCurve,
                    aBondingCurve,
                    PUMP_PROGRAM_ID,
                    walletKeypair,
                    tokenAmount,
                    maxSolCost,
                    ata,
                    ataInstruction,
                    splToken.TOKEN_PROGRAM_ID,
                    this.config.antiMEV,
                    this.config.jito_config,
                    microLamports
                  );
                  const blockhash = yield connection.getLatestBlockhash("confirmed");
                  const messageV0 = new web3_js.TransactionMessage({
                    payerKey: walletKeypair.publicKey,
                    recentBlockhash: blockhash.blockhash,
                    instructions: transaction_instructions
                  }).compileToV0Message();
                  const transaction = new web3_js.VersionedTransaction(messageV0);
                  transaction.sign([walletKeypair]);
                  if (this.config.antiMEV) {
                    if (!jito_client) {
                      console.error("Jito not working, skipping transaction");
                      continue;
                    }
                    const bundle = new types_js.Bundle([transaction]);
                    try {
                      const signature = yield jito_client.sendBundle(bundle);
                      console.log(`Bundle sent: ${signature}`);
                    } catch (error) {
                      console.error("Error sending bundle:", error);
                      continue;
                    }
                  } else {
                    const signature = yield connection.sendTransaction(transaction, {
                      skipPreflight: true,
                      maxRetries: 3
                    });
                    console.log(`Transaction Sent: https://solscan.io/tx/${signature}`);
                  }
                  this.transactionCount++;
                  this.lastUpdate = Date.now();
                  yield new Promise((resolve) => {
                    var _a2;
                    return setTimeout(resolve, ((_a2 = this.config) == null ? void 0 : _a2.delay) || 3e3);
                  });
                } catch (error) {
                  console.error("Error processing wallet:", error);
                  continue;
                }
              }
            }
          } catch (error) {
            console.error("Fatal error in microBuySpam:", error);
            this.stopSignal = true;
          }
        });
      }
    };
  }
});
function buy_transaction(wallet, connection, min_buy, max_buy, token_address, bonding_curve, a_bonding_curve, PUMP_PROGRAM_ID, tip_instruction, fee_payer_keypair, jito_client, minimum_delay, maximum_delay) {
  return __async(this, null, function* () {
    const wallet_keypair = web3_js.Keypair.fromSecretKey(bs583__default.default.decode(wallet.privKey));
    const associated_token_account = splToken.getAssociatedTokenAddressSync(token_address, wallet_keypair.publicKey, true);
    const wallet_balance = yield connection.getBalance(wallet_keypair.publicKey);
    const ata_instruction = splToken.createAssociatedTokenAccountIdempotentInstruction(wallet_keypair.publicKey, associated_token_account, wallet_keypair.publicKey, token_address, splToken.TOKEN_PROGRAM_ID, splToken.ASSOCIATED_TOKEN_PROGRAM_ID);
    if (wallet_balance <= 0) return;
    let buy_amount = BigInt(Math.floor((Math.random() * (max_buy - min_buy) + min_buy) * 1e9));
    if (buy_amount >= wallet_balance) {
      buy_amount = BigInt(Math.floor(wallet_balance * 0.75));
    }
    const accountInfo = yield connection.getAccountInfo(bonding_curve);
    if (!accountInfo) {
      throw new Error("Failed to fetch account info for bonding curve");
    }
    const { virtualSolReserves, virtualTokenReserves } = BondingCurveLayout.deserialize(accountInfo.data.slice(8));
    const max_sol_cost = BigInt(Number(buy_amount) + Math.floor(Number(buy_amount) * 0.15));
    const k = virtualSolReserves * virtualTokenReserves;
    const new_sol_reserves = virtualSolReserves + buy_amount;
    const new_token_reserves = k / new_sol_reserves;
    const tokens_to_receive = virtualTokenReserves - new_token_reserves;
    const BUY_INSTRUCTION_BUFFER = Buffer.from([
      102,
      6,
      61,
      18,
      1,
      218,
      235,
      234,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0
    ]);
    BUY_INSTRUCTION_BUFFER.writeBigUInt64LE(BigInt(tokens_to_receive), 8);
    BUY_INSTRUCTION_BUFFER.writeBigUInt64LE(max_sol_cost, 16);
    const buy_instruction = new web3_js.TransactionInstruction({
      programId: PUMP_PROGRAM_ID,
      keys: [
        { pubkey: new web3_js.PublicKey("4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf"), isSigner: false, isWritable: false },
        { pubkey: new web3_js.PublicKey("CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM"), isSigner: false, isWritable: true },
        { pubkey: token_address, isSigner: false, isWritable: false },
        { pubkey: bonding_curve, isSigner: false, isWritable: true },
        { pubkey: a_bonding_curve, isSigner: false, isWritable: true },
        { pubkey: associated_token_account, isSigner: false, isWritable: true },
        { pubkey: wallet_keypair.publicKey, isSigner: true, isWritable: true },
        { pubkey: web3_js.SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: splToken.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: web3_js.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
        { pubkey: new web3_js.PublicKey("Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1"), isSigner: false, isWritable: false },
        { pubkey: PUMP_PROGRAM_ID, isSigner: false, isWritable: false }
      ],
      data: BUY_INSTRUCTION_BUFFER
    });
    const { blockhash } = yield connection.getLatestBlockhash("confirmed");
    const transaction = new web3_js.VersionedTransaction(
      new web3_js.TransactionMessage({
        payerKey: wallet_keypair.publicKey,
        recentBlockhash: blockhash,
        instructions: [ata_instruction, buy_instruction, tip_instruction]
      }).compileToV0Message()
    );
    transaction.sign([wallet_keypair, fee_payer_keypair]);
    const bundle = new types_js.Bundle([transaction], 20);
    yield jito_client.sendBundle(bundle);
    const delay = Math.floor(Math.random() * (maximum_delay - minimum_delay)) + minimum_delay;
    yield new Promise((resolve) => setTimeout(resolve, delay));
  });
}
function sell_transaction(wallet, connection, token_address, bonding_curve, a_bonding_curve, PUMP_PROGRAM_ID, tip_instruction, jito_client, fee_payer_keypair, minimum_delay, maximum_delay) {
  return __async(this, null, function* () {
    const wallet_keypair = web3_js.Keypair.fromSecretKey(bs583__default.default.decode(wallet.privKey));
    const associated_token_account = splToken.getAssociatedTokenAddressSync(token_address, wallet_keypair.publicKey, true);
    const wallet_balance = yield connection.getBalance(wallet_keypair.publicKey);
    if (wallet_balance <= 0) return;
    const token_account = yield connection.getAccountInfo(associated_token_account);
    if (!token_account) {
      console.log("No token account found.");
      return;
    }
    const token_balance = splToken.AccountLayout.decode(token_account.data).amount;
    if (token_balance === BigInt(0)) {
      console.log("Token balance is 0.");
      return;
    }
    const min_sol_output = BigInt(0);
    const SELL_INSTRUCTION_BUFFER = Buffer.from([
      51,
      230,
      133,
      164,
      1,
      127,
      131,
      173,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0
    ]);
    SELL_INSTRUCTION_BUFFER.writeBigUInt64LE(token_balance, 8);
    SELL_INSTRUCTION_BUFFER.writeBigUInt64LE(min_sol_output, 16);
    const sell_instruction = new web3_js.TransactionInstruction({
      programId: PUMP_PROGRAM_ID,
      keys: [
        { pubkey: new web3_js.PublicKey("4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf"), isSigner: false, isWritable: false },
        { pubkey: new web3_js.PublicKey("CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM"), isSigner: false, isWritable: true },
        { pubkey: token_address, isSigner: false, isWritable: false },
        { pubkey: bonding_curve, isSigner: false, isWritable: true },
        { pubkey: a_bonding_curve, isSigner: false, isWritable: true },
        { pubkey: associated_token_account, isSigner: false, isWritable: true },
        { pubkey: wallet_keypair.publicKey, isSigner: true, isWritable: true },
        { pubkey: web3_js.SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: splToken.ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: splToken.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: new web3_js.PublicKey("Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1"), isSigner: false, isWritable: false },
        { pubkey: PUMP_PROGRAM_ID, isSigner: false, isWritable: false }
      ],
      data: SELL_INSTRUCTION_BUFFER
    });
    const { blockhash } = yield connection.getLatestBlockhash("confirmed");
    const transaction = new web3_js.VersionedTransaction(
      new web3_js.TransactionMessage({
        payerKey: wallet_keypair.publicKey,
        recentBlockhash: blockhash,
        instructions: [sell_instruction, tip_instruction]
      }).compileToV0Message()
    );
    transaction.sign([wallet_keypair, fee_payer_keypair]);
    const bundle = new types_js.Bundle([transaction], 20);
    yield jito_client.sendBundle(bundle);
    const delay = Math.floor(Math.random() * (maximum_delay - minimum_delay)) + minimum_delay;
    yield new Promise((resolve) => setTimeout(resolve, delay));
  });
}
var HumanTask;
var init_HumanTask = __esm({
  "electron/tasks/pump/HumanTask.ts"() {
    init_PUMP_LAYOUT();
    HumanTask = class {
      constructor() {
        this.connection = null;
        this.stopSignal = false;
        this.transactionCount = 0;
        this.lastUpdate = Date.now();
        this.config = null;
        this.retryDelay = 500;
        this.maxRetryDelay = 5e3;
        this.reset();
      }
      reset() {
        this.connection = null;
        this.stopSignal = false;
        this.transactionCount = 0;
        this.lastUpdate = Date.now();
        this.config = null;
      }
      start(data) {
        return __async(this, null, function* () {
          try {
            if (this.connection) {
              throw new Error("Task already running");
            }
            this.config = data;
            this.stopSignal = false;
            this.transactionCount = 0;
            this.connection = new web3_js.Connection(data.rpc, {
              commitment: "confirmed",
              wsEndpoint: data.ws
            });
            yield this.runHumanLoop();
          } catch (error) {
            console.error("Error starting Volume task:", error);
            yield this.cleanup();
            throw error;
          }
        });
      }
      runHumanLoop() {
        return __async(this, null, function* () {
          var _a, _b, _c, _d;
          if (!this.config) throw new Error("Config is null");
          const wallets = this.config.wallets.map((wallet) => {
            return {
              privKey: wallet.privateKey,
              pubKey: wallet.publicKey
            };
          });
          const token_address = new web3_js.PublicKey(this.config.token);
          if (!this.config.jito_config) throw new Error("Jito config is missing");
          const jito_client = searcher_js.searcherClient((_a = this.config.jito_config) == null ? void 0 : _a.jitoURL);
          const connection = new web3_js.Connection(this.config.rpc, "confirmed");
          const fee_payer_keypair = web3_js.Keypair.fromSecretKey(bs583__default.default.decode(this.config.funderWallet));
          const PUMP_PROGRAM_ID = new web3_js.PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");
          const bonding_curve = web3_js.PublicKey.findProgramAddressSync([utf8_js.encode("bonding-curve"), token_address.toBuffer()], PUMP_PROGRAM_ID)[0];
          const a_bonding_curve = splToken.getAssociatedTokenAddressSync(token_address, bonding_curve, true);
          const tip_instruction = web3_js.SystemProgram.transfer({ fromPubkey: fee_payer_keypair.publicKey, toPubkey: new web3_js.PublicKey("ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt"), lamports: ((_b = this.config.jito_config) == null ? void 0 : _b.tipAmount) * 1e9 });
          const min_buy = (_c = this.config.humanMinBuy) != null ? _c : 0;
          const max_buy = (_d = this.config.humanMaxBuy) != null ? _d : 0;
          const buy_count = this.config.humanBuys;
          const sell_count = this.config.humanSells;
          const minimum_delay = this.config.humanMinDelay;
          const maximum_delay = this.config.humanMaxDelay;
          let buy_wallets = [];
          let sell_wallets = [];
          while (!this.stopSignal) {
            while (sell_wallets.length < wallets.length) {
              if (this.stopSignal) {
                console.log("Stop signal received, breaking human mode loop");
                break;
              }
              for (let i = 0; i < buy_count; i++) {
                if (this.stopSignal) {
                  console.log("Stop signal received, breaking human mode loop");
                  break;
                }
                const wallet_index = buy_wallets.length % wallets.length;
                const wallet = wallets[wallet_index];
                if (!buy_wallets.includes(wallet)) {
                  yield buy_transaction(wallet, connection, min_buy, max_buy, token_address, bonding_curve, a_bonding_curve, PUMP_PROGRAM_ID, tip_instruction, fee_payer_keypair, jito_client, minimum_delay, maximum_delay);
                  buy_wallets.push(wallet);
                }
              }
              for (let i = 0; i < sell_count; i++) {
                if (this.stopSignal) {
                  console.log("Stop signal received, breaking human mode loop");
                  break;
                }
                const sell_index = sell_wallets.length % wallets.length;
                const sell_wallet = wallets[sell_index];
                if (!sell_wallets.includes(sell_wallet)) {
                  yield sell_transaction(sell_wallet, connection, token_address, bonding_curve, a_bonding_curve, PUMP_PROGRAM_ID, tip_instruction, jito_client, fee_payer_keypair, minimum_delay, maximum_delay);
                  sell_wallets.push(sell_wallet);
                }
              }
              this.lastUpdate = Date.now();
            }
            sell_wallets = [];
            buy_wallets = [];
          }
        });
      }
      stop() {
        return __async(this, null, function* () {
          console.log("Stopping Human task...");
          try {
            this.stopSignal = true;
            yield new Promise((resolve) => setTimeout(resolve, 100));
            yield this.cleanup();
            console.log("Human task stopped successfully");
          } catch (error) {
            console.error("Error stopping Human task:", error);
            throw error;
          }
        });
      }
      cleanup() {
        return __async(this, null, function* () {
          this.connection = null;
          this.config = null;
          this.transactionCount = 0;
          this.lastUpdate = Date.now();
        });
      }
      getStats() {
        return {
          transactionCount: this.transactionCount,
          lastUpdate: this.lastUpdate,
          isRunning: !this.stopSignal && this.connection !== null
        };
      }
    };
  }
});
var RayVolumeTask;
var init_RayVolumeTask = __esm({
  "electron/tasks/Raydium/RayVolumeTask.ts"() {
    RayVolumeTask = class {
      constructor() {
        this.connection = null;
        this.stopSignal = false;
        this.transactionCount = 0;
        this.lastUpdate = Date.now();
        this.config = null;
        this.reset();
      }
      reset() {
        this.connection = null;
        this.stopSignal = false;
        this.transactionCount = 0;
        this.lastUpdate = Date.now();
        this.config = null;
      }
      start(data) {
        return __async(this, null, function* () {
          console.log("Starting Raydium Volume task...");
          try {
            if (this.connection) {
              throw new Error("Task already running");
            }
            this.config = data;
            this.stopSignal = false;
            this.transactionCount = 0;
            console.log("Data: ", data);
            this.connection = new web3_js.Connection(data.rpc, {
              commitment: "confirmed",
              wsEndpoint: data.ws
            });
            yield this.runVolumeLoop();
          } catch (error) {
            console.error("Error starting Volume task:", error);
            yield this.cleanup();
            throw error;
          }
        });
      }
      runVolumeLoop() {
        return __async(this, null, function* () {
          var _a, _b, _c, _d, _e, _f;
          console.log("Running Raydium Volume task...");
          if (((_a = this.config) == null ? void 0 : _a.wallets.length) === 0 || !((_b = this.config) == null ? void 0 : _b.wallets)) {
            throw new Error("No wallets provided");
          }
          const wallets = this.config.wallets.map((wallet) => {
            return {
              privKey: wallet.privateKey,
              pubKey: wallet.publicKey
            };
          });
          if (this.config.jito_config && !this.config.jito_config) {
            throw new Error("Jito config missing");
          }
          const jito = this.config.jito_config;
          const true_slippage = BigInt(((_c = this.config) == null ? void 0 : _c.slippage) || 10) + BigInt(1);
          const token_address = new web3_js.PublicKey((_d = this.config) == null ? void 0 : _d.token);
          const connection = new web3_js.Connection(this.config.rpc);
          const jito_client = ((_e = this.config) == null ? void 0 : _e.antiMEV) || jito && jito.jitoURL ? searcher_js.searcherClient((jito == null ? void 0 : jito.jitoURL) || "ny.mainnet.block-engine.jito.wtf") : null;
          const COMPUTE_UNIT_LIMIT = 15e4;
          const priority_fee_lamports = Math.floor(this.config.priority_fee * 1e9);
          const micro_lamports_fee = Number(BigInt(priority_fee_lamports) * BigInt(15) / BigInt(COMPUTE_UNIT_LIMIT));
          const RAYDIUM_V4 = new web3_js.PublicKey("675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8");
          const AMM_AUTHORITY = new web3_js.PublicKey("5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1");
          const OPENBOOK_PROGRAM = new web3_js.PublicKey("srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX");
          const market_id = new web3_js.PublicKey(this.config.pool_info.market_id);
          const market_decode = openbook.Market.getLayout(OPENBOOK_PROGRAM).decode(Buffer.from(this.config.pool_info.market_data));
          const market_buffer = market_id.toBuffer();
          const ray_buffer = RAYDIUM_V4.toBuffer();
          const pool_id = web3_js.PublicKey.findProgramAddressSync(
            [ray_buffer, market_buffer, Buffer.from("amm_associated_seed", "utf-8")],
            RAYDIUM_V4
          )[0];
          const open_orders = web3_js.PublicKey.findProgramAddressSync(
            [ray_buffer, market_buffer, Buffer.from("open_order_associated_seed", "utf-8")],
            RAYDIUM_V4
          )[0];
          const target_orders = web3_js.PublicKey.findProgramAddressSync(
            [ray_buffer, market_buffer, Buffer.from("target_associated_seed", "utf-8")],
            RAYDIUM_V4
          )[0];
          const base_vault = web3_js.PublicKey.findProgramAddressSync(
            [ray_buffer, market_buffer, Buffer.from("coin_vault_associated_seed", "utf-8")],
            RAYDIUM_V4
          )[0];
          const quote_vault = web3_js.PublicKey.findProgramAddressSync(
            [ray_buffer, market_buffer, Buffer.from("pc_vault_associated_seed", "utf-8")],
            RAYDIUM_V4
          )[0];
          while (!this.stopSignal) {
            if (this.stopSignal) {
              console.log("Stop signal received, breaking volume loop", this.transactionCount + 1);
              break;
            }
            console.log("Running volume loop", this.transactionCount + 1);
            for (let i = 0; i < wallets.length; i++) {
              const random_amount = Math.random() * (this.config.maxBuy - this.config.minBuy) + this.config.minBuy;
              const buy_in_lamports = BigInt(Math.floor(random_amount * 1e9));
              const total_fees = jito ? jito.tipAmount * 1e9 : this.config.priority_fee * 1e9;
              const required_balance = Number(buy_in_lamports) + total_fees + 5e3;
              const wallet_keypair = web3_js.Keypair.fromSecretKey(bs583__default.default.decode(wallets[i].privKey));
              const wallet_solana_balance = yield connection.getBalance(wallet_keypair.publicKey);
              if (wallet_solana_balance <= required_balance) continue;
              const priority_instructions = jito ? [web3_js.SystemProgram.transfer({
                fromPubkey: wallet_keypair.publicKey,
                toPubkey: new web3_js.PublicKey("ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt"),
                lamports: jito.tipAmount * 1e9
              })] : [
                web3_js.ComputeBudgetProgram.setComputeUnitPrice({ microLamports: micro_lamports_fee }),
                web3_js.ComputeBudgetProgram.setComputeUnitLimit({ units: COMPUTE_UNIT_LIMIT })
              ];
              const wrapped_sol_account = splToken.getAssociatedTokenAddressSync(splToken.NATIVE_MINT, wallet_keypair.publicKey);
              const wrapped_sol_instruction = splToken.createAssociatedTokenAccountIdempotentInstruction(wallet_keypair.publicKey, wrapped_sol_account, wallet_keypair.publicKey, splToken.NATIVE_MINT);
              const fund_wrapped_sol = web3_js.SystemProgram.transfer({ fromPubkey: wallet_keypair.publicKey, toPubkey: wrapped_sol_account, lamports: buy_in_lamports });
              const close_wrapped_sol = splToken.createCloseAccountInstruction(wrapped_sol_account, wallet_keypair.publicKey, wallet_keypair.publicKey);
              const associated_token_account = splToken.getAssociatedTokenAddressSync(token_address, wallet_keypair.publicKey);
              const ata_instruction = splToken.createAssociatedTokenAccountIdempotentInstruction(wallet_keypair.publicKey, associated_token_account, wallet_keypair.publicKey, token_address, splToken.TOKEN_PROGRAM_ID, splToken.ASSOCIATED_TOKEN_PROGRAM_ID);
              const wrapped_sol_sync = splToken.createSyncNativeInstruction(wrapped_sol_account);
              const { blockhash } = yield connection.getLatestBlockhash("confirmed");
              const [base_reserves, quote_reserves] = yield connection.getMultipleAccountsInfo([base_vault, quote_vault]);
              if (!base_reserves) {
                throw new Error("Failed to fetch base reserves");
              }
              const base_amount = base_reserves.data.readBigUInt64LE(64);
              if (!quote_reserves) {
                throw new Error("Failed to fetch quote reserves");
              }
              const quote_amount = quote_reserves.data.readBigUInt64LE(64);
              const k = base_amount * quote_amount;
              const new_base_amount = base_amount + buy_in_lamports;
              const new_quote_amount = k / new_base_amount;
              const tokens_to_receive = quote_amount - new_quote_amount;
              const min_tokens_out = tokens_to_receive - tokens_to_receive * BigInt(true_slippage) / BigInt(100);
              const RAY_BUY_BUFFER = Buffer.from([
                9,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0
              ]);
              RAY_BUY_BUFFER.writeBigUInt64LE(buy_in_lamports, 1);
              RAY_BUY_BUFFER.writeBigUInt64LE(min_tokens_out, 9);
              const buy_instruction = new web3_js.TransactionInstruction({
                programId: RAYDIUM_V4,
                keys: [
                  { pubkey: splToken.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                  { pubkey: pool_id, isSigner: false, isWritable: true },
                  { pubkey: AMM_AUTHORITY, isSigner: false, isWritable: false },
                  { pubkey: open_orders, isSigner: false, isWritable: true },
                  { pubkey: target_orders, isSigner: false, isWritable: true },
                  { pubkey: base_vault, isSigner: false, isWritable: true },
                  { pubkey: quote_vault, isSigner: false, isWritable: true },
                  { pubkey: OPENBOOK_PROGRAM, isSigner: false, isWritable: false },
                  { pubkey: market_id, isSigner: false, isWritable: true },
                  { pubkey: market_decode.bids, isSigner: false, isWritable: true },
                  { pubkey: market_decode.asks, isSigner: false, isWritable: true },
                  { pubkey: market_decode.eventQueue, isSigner: false, isWritable: true },
                  { pubkey: market_decode.baseVault, isSigner: false, isWritable: true },
                  { pubkey: market_decode.quoteVault, isSigner: false, isWritable: true },
                  { pubkey: AMM_AUTHORITY, isSigner: false, isWritable: false },
                  { pubkey: wrapped_sol_account, isSigner: false, isWritable: true },
                  { pubkey: associated_token_account, isSigner: false, isWritable: true },
                  { pubkey: wallet_keypair.publicKey, isSigner: true, isWritable: true }
                ],
                data: RAY_BUY_BUFFER
              });
              const transaction = new web3_js.VersionedTransaction(new web3_js.TransactionMessage({
                payerKey: wallet_keypair.publicKey,
                recentBlockhash: blockhash,
                instructions: [...priority_instructions, wrapped_sol_instruction, fund_wrapped_sol, wrapped_sol_sync, ata_instruction, buy_instruction, close_wrapped_sol]
              }).compileToV0Message());
              transaction.sign([wallet_keypair]);
              console.log("Wallet used: ", `https://solscan.io/address/${wallet_keypair.publicKey}`);
              if (this.config.antiMEV || jito && jito.jitoURL && jito_client) {
                const bundle = new types_js.Bundle([transaction], 1);
                if (jito_client) {
                  const bundleId = yield jito_client.sendBundle(bundle);
                  console.log("Bundle sent:", bundleId);
                }
              } else {
                const signature = yield connection.sendTransaction(transaction, {
                  skipPreflight: true,
                  maxRetries: 5
                });
                console.log("Transaction sent: ", `https://solscan.io/tx/${signature}`);
              }
              const delay = ((_f = this.config) == null ? void 0 : _f.delay) || 2500;
              yield new Promise((resolve) => setTimeout(resolve, delay - 500));
              this.transactionCount++;
            }
          }
        });
      }
      stop() {
        return __async(this, null, function* () {
          console.log("Stopping Volume task...");
          this.stopSignal = true;
          yield this.cleanup();
        });
      }
      getStats() {
        return {
          transactionCount: this.transactionCount,
          lastUpdate: this.lastUpdate,
          isRunning: !this.stopSignal && this.connection !== null
        };
      }
      cleanup() {
        return __async(this, null, function* () {
          console.log("Cleaning up Raydium Volume task...");
          this.connection = null;
          this.config = null;
        });
      }
    };
  }
});

// electron/tasks/Raydium/RayGMTask.ts
var RayGMTask;
var init_RayGMTask = __esm({
  "electron/tasks/Raydium/RayGMTask.ts"() {
    RayGMTask = class {
      start(data) {
        return __async(this, null, function* () {
          console.log("Starting GM task...");
        });
      }
      stop() {
        return __async(this, null, function* () {
          console.log("Stopping Volume task...");
        });
      }
      getStats() {
        return {
          transactionCount: 0,
          lastUpdate: 0,
          isRunning: false
        };
      }
    };
  }
});

// electron/src/TaskManager.ts
var TaskManager;
var init_TaskManager = __esm({
  "electron/src/TaskManager.ts"() {
    init_BumpitTask();
    init_VolumeTask();
    init_HumanTask();
    init_RayVolumeTask();
    init_RayGMTask();
    TaskManager = class {
      constructor() {
        this.activeTasks = /* @__PURE__ */ new Map();
        this.mainWindow = null;
        this.statsInterval = null;
        this.startStatsMonitoring();
      }
      getTaskKey(tokenMint, platform, type) {
        return `${platform}:${tokenMint}:${type}`;
      }
      checkForConflicts(platform, type) {
        for (const task of this.activeTasks.values()) {
          if (task.type === type && task.platform !== platform) {
            return true;
          }
          if (platform === "raydium" && task.platform !== "raydium") {
            return true;
          }
          if (platform !== "raydium" && task.platform === "raydium") {
            return true;
          }
        }
        return false;
      }
      setMainWindow(window) {
        this.mainWindow = window;
      }
      createTaskInstance(platform, type) {
        switch (platform) {
          case "pump":
            switch (type) {
              case "bumpit":
                return new BumpitTask();
              case "volume":
                return new VolumeTask();
              case "human":
                return new HumanTask();
              default:
                throw new Error(`Unknown task type: ${type}`);
            }
          case "raydium":
            switch (type) {
              case "bumpit":
                return new RayGMTask();
              case "volume":
                return new RayVolumeTask();
              case "human":
                throw new Error("Human task not supported for Raydium");
              default:
                throw new Error(`Unknown task type: ${type}`);
            }
          default:
            throw new Error(`Unknown platform: ${platform}`);
        }
      }
      startTask(type, config) {
        return __async(this, null, function* () {
          var _a, _b, _c, _d, _e, _f, _g, _h;
          console.log("Start Task Called with:", {
            type,
            platform: config.platform,
            tokenMint: config.token,
            config: __spreadProps(__spreadValues({}, config), {
              wallets: `${config.wallets.length} wallets`
              // Don't log private keys
            })
          });
          if (this.checkForConflicts(config.platform, type)) {
            throw new Error(
              `Cannot start ${config.platform} ${type} task - conflicting task is already running. Raydium tasks cannot run alongside other platform tasks, and same task types cannot run across different platforms.`
            );
          }
          const key = this.getTaskKey(config.token, config.platform, type);
          console.log("Generated task key:", key);
          console.log(
            "Current active tasks before adding:",
            Array.from(this.activeTasks.entries()).map(([k, v]) => ({
              key: k,
              type: v.type,
              tokenMint: v.tokenMint,
              isRunning: v.stats.isRunning
            }))
          );
          if (this.activeTasks.has(key)) {
            console.log(`Task already exists with key: ${key}`);
            throw new Error(`${type} task is already running for token ${config.token}`);
          }
          switch (type) {
            case "bumpit":
              new BumpitTask();
              break;
            case "volume":
              new VolumeTask();
              break;
            case "human":
              new HumanTask();
              break;
            default:
              throw new Error(`Unknown task type: ${type}`);
          }
          try {
            const instance2 = this.createTaskInstance(config.platform, type);
            const task = {
              tokenMint: config.token,
              platform: config.platform,
              type,
              instance: instance2,
              stats: {
                transactionCount: 0,
                lastUpdate: Date.now(),
                isRunning: true
              }
            };
            this.activeTasks.set(key, task);
            console.log(
              "Task stored with key:",
              key,
              "Current tasks:",
              Array.from(this.activeTasks.entries()).map(([k, v]) => ({
                key: k,
                type: v.type,
                tokenMint: v.tokenMint,
                isRunning: v.stats.isRunning
              }))
            );
            const configWithDefaults = __spreadProps(__spreadValues({}, config), {
              minBuy: (_a = config.minBuy) != null ? _a : 0,
              maxBuy: (_b = config.maxBuy) != null ? _b : 0,
              slippage: (_c = config.slippage) != null ? _c : 0,
              antiMEV: (_d = config.antiMEV) != null ? _d : false,
              jito_config: {
                jitoURL: (_f = (_e = config.jito_config) == null ? void 0 : _e.jitoURL) != null ? _f : "",
                tipAmount: (_h = (_g = config.jito_config) == null ? void 0 : _g.tipAmount) != null ? _h : 0
              },
              pool_info: config.pool_info
            });
            yield instance2.start(configWithDefaults);
            console.log("Task instance started successfully");
            this.notifyUpdate(key);
            return { success: true };
          } catch (error) {
            console.error("Error in startTask:", error);
            this.activeTasks.delete(key);
            throw error;
          }
        });
      }
      stopTask(tokenMint, platform, type) {
        return __async(this, null, function* () {
          const key = this.getTaskKey(tokenMint, platform, type);
          console.log("Stop Task Called:", { tokenMint, type, key });
          console.log(
            "Current active tasks:",
            Array.from(this.activeTasks.entries()).map(([k, v]) => ({
              key: k,
              type: v.type,
              tokenMint: v.tokenMint,
              isRunning: v.stats.isRunning
            }))
          );
          const task = this.activeTasks.get(key);
          if (!task) {
            console.log(`No task found with key: ${key}`);
            return { success: false, error: `No ${type} task found for token ${tokenMint}` };
          }
          try {
            console.log(`Stopping task: ${key}`);
            yield task.instance.stop();
            task.stats.isRunning = false;
            this.notifyUpdate(key);
            this.activeTasks.delete(key);
            console.log("Task stopped successfully");
            return { success: true };
          } catch (error) {
            console.error("Error stopping task:", error);
            throw error;
          }
        });
      }
      getTaskStatus(tokenMint, platform, type) {
        const key = this.getTaskKey(tokenMint, platform, type);
        const task = this.activeTasks.get(key);
        return task ? {
          type: task.type,
          platform: task.platform,
          tokenMint: task.tokenMint,
          stats: task.stats
        } : null;
      }
      getAllRunningTasks() {
        const runningTasks = [];
        for (const [_, task] of this.activeTasks.entries()) {
          if (task.stats.isRunning) {
            runningTasks.push({
              type: task.type,
              platform: task.platform,
              tokenMint: task.tokenMint,
              stats: task.stats
            });
          }
        }
        return runningTasks;
      }
      // TaskManager.ts
      notifyUpdate(taskKey) {
        if (!this.mainWindow) return;
        const task = this.activeTasks.get(taskKey);
        if (task) {
          this.mainWindow.webContents.send("task:update", {
            type: task.type,
            platform: task.platform,
            tokenMint: task.tokenMint,
            stats: task.stats
          });
        }
      }
      startStatsMonitoring() {
        if (this.statsInterval) {
          clearInterval(this.statsInterval);
        }
        this.statsInterval = setInterval(() => {
          for (const [key, task] of this.activeTasks.entries()) {
            try {
              const stats = task.instance.getStats();
              task.stats = stats;
              if (!stats.isRunning) {
                this.activeTasks.delete(key);
              }
              this.notifyUpdate(key);
            } catch (error) {
              console.error(`Error monitoring ${task.type} task:`, error);
            }
          }
        }, 2e3);
      }
      cleanup() {
        if (this.statsInterval) {
          clearInterval(this.statsInterval);
          this.statsInterval = null;
        }
        for (const [key, task] of this.activeTasks.entries()) {
          try {
            task.instance.stop();
          } catch (error) {
            console.error(`Error stopping task ${key}:`, error);
          }
        }
        this.activeTasks.clear();
      }
    };
  }
});
var BalanceChecker;
var init_BalanceChecker = __esm({
  "electron/src/BalanceChecker.ts"() {
    BalanceChecker = class {
      constructor() {
        this.connection = null;
        this.setupIpcHandlers();
      }
      cleanup() {
        try {
          this.connection = null;
          electron.ipcMain.removeHandler("balance:setupConnection");
          electron.ipcMain.removeHandler("balance:checkMultiple");
        } catch (error) {
          log__default.default.error("Error in cleanup:", error);
        }
      }
      setupIpcHandlers() {
        electron.ipcMain.handle("balance:setupConnection", (_, config) => __async(this, null, function* () {
          try {
            yield this.setupConnection(config);
            return { success: true };
          } catch (error) {
            log__default.default.error("Setup connection error:", error);
            return {
              success: false,
              error: error instanceof Error ? error.message : String(error)
            };
          }
        }));
        electron.ipcMain.handle("balance:checkMultiple", (_, wallets) => __async(this, null, function* () {
          try {
            return yield this.checkMultipleBalances(wallets);
          } catch (error) {
            log__default.default.error("Check balances error:", error);
            return [];
          }
        }));
      }
      setupConnection(config) {
        return __async(this, null, function* () {
          try {
            this.connection = new web3_js.Connection(config.rpcEndpoint, {
              commitment: "processed",
              wsEndpoint: config.wsEndpoint
            });
            yield this.connection.getLatestBlockhash("confirmed");
            log__default.default.info("Connection established successfully");
            return true;
          } catch (error) {
            log__default.default.error("Setup connection error:", error);
            throw error;
          }
        });
      }
      checkMultipleBalances(wallets) {
        return __async(this, null, function* () {
          try {
            if (!this.connection) {
              throw new Error("Connection not initialized");
            }
            const publicKeys = wallets.map((wallet) => new web3_js.PublicKey(wallet.publicKey));
            const accountInfos = yield this.connection.getMultipleAccountsInfo(publicKeys);
            const balances = accountInfos.map((info, index) => {
              const wallet = wallets[index];
              return {
                id: wallet.id,
                type: wallet.type,
                publicKey: wallet.publicKey,
                sol: ((info == null ? void 0 : info.lamports) || 0) / web3_js.LAMPORTS_PER_SOL
              };
            });
            return balances;
          } catch (error) {
            log__default.default.error("Error in checkMultipleBalances:", error);
            return [];
          }
        });
      }
    };
  }
});
var require_main = __commonJS({
  "electron/src/main.ts"(exports) {
    init_TaskManager();
    init_BalanceChecker();
    var taskManager = null;
    var createWindow = () => {
      const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize;
      const mainWindow = new electron.BrowserWindow({
        height,
        width,
        webPreferences: {
          devTools: true,
          preload: path.join(__dirname, "preload.js"),
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true,
          webSecurity: true,
          allowRunningInsecureContent: false,
          experimentalFeatures: false,
          // Memory protection settings
          javascript: true,
          webgl: false,
          plugins: false,
          // Process protection
          backgroundThrottling: true,
          v8CacheOptions: "code"
        },
        show: true,
        closable: true,
        title: "MemeTools",
        icon: path.join(__dirname, "icon.png")
      });
      const isMac = process.platform === "darwin";
      const template = [
        ...isMac ? [{
          role: "appMenu",
          submenu: [
            { role: "about" },
            { type: "separator" },
            { role: "services" },
            { type: "separator" },
            { role: "hide" },
            { role: "hideOthers" },
            { role: "unhide" },
            { type: "separator" },
            { role: "quit" }
          ]
        }] : [],
        {
          label: "About",
          click: () => {
            electron.dialog.showMessageBox({
              title: "About",
              icon: path.join(__dirname, "icon.png"),
              message: "MemeTools",
              detail: `Version ${electron.app.getVersion()}
\xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} MemeTools`,
              type: "info"
            });
          }
        },
        {
          label: "Edit",
          submenu: [
            { role: "undo" },
            { role: "redo" },
            { type: "separator" },
            { role: "cut" },
            { role: "copy" },
            { role: "paste" }
          ]
        },
        {
          label: "View",
          submenu: [
            { role: "reload" },
            { role: "forceReload" },
            { type: "separator" },
            { role: "resetZoom" },
            { role: "zoomIn" },
            { role: "zoomOut" },
            { type: "separator" },
            { role: "togglefullscreen" },
            //{ role: 'toggleDevTools' }, // toggle dev false
          ]
        },
        {
          label: isMac ? "Close" : "Exit",
          role: isMac ? "close" : "quit"
        }
      ];
      const menu = electron.Menu.buildFromTemplate(template);
      electron.Menu.setApplicationMenu(menu);
      const setupBalanceChecker = () => {
        new BalanceChecker();
      };
      setupBalanceChecker();
      const setupTaskManager = () => {
        if (!mainWindow) return;
        electron.ipcMain.removeHandler("task:start");
        electron.ipcMain.removeHandler("task:stop");
        electron.ipcMain.removeHandler("task:status");
        electron.ipcMain.removeHandler("task:getAllRunning");
        taskManager = new TaskManager();
        taskManager.setMainWindow(mainWindow);
        electron.ipcMain.handle("task:start", (_0, _1) => __async(exports, [_0, _1], function* (_, { type, data }) {
          try {
            if (!taskManager) throw new Error("Task manager not initialized");
            return yield taskManager.startTask(type, data);
          } catch (error) {
            log__default.default.error("Task start error:", error);
            return {
              success: false,
              error: error instanceof Error ? error.message : String(error)
            };
          }
        }));
        electron.ipcMain.handle("task:stop", (_0, _1) => __async(exports, [_0, _1], function* (_, { tokenMint, platform, type }) {
          try {
            if (!taskManager) throw new Error("Task manager not initialized");
            return yield taskManager.stopTask(tokenMint, platform, type);
          } catch (error) {
            log__default.default.error("Task stop error:", error);
            return {
              success: false,
              error: error instanceof Error ? error.message : String(error)
            };
          }
        }));
        electron.ipcMain.handle("task:status", (_, { tokenMint, platform, type }) => {
          try {
            if (!taskManager) throw new Error("Task manager not initialized");
            return taskManager.getTaskStatus(tokenMint, platform, type);
          } catch (error) {
            log__default.default.error("Task status error:", error);
            return null;
          }
        });
        electron.ipcMain.handle("task:getAllRunning", () => {
          try {
            if (!taskManager) throw new Error("Task manager not initialized");
            return taskManager.getAllRunningTasks();
          } catch (error) {
            log__default.default.error("Get all running tasks error:", error);
            return [];
          }
        });
      };
      setupTaskManager();
      mainWindow.on("ready-to-show", () => mainWindow == null ? void 0 : mainWindow.show());
      const loadURL = () => __async(exports, null, function* () {
        if (utils.is.dev) {
          mainWindow == null ? void 0 : mainWindow.loadURL("http://localhost:3000");
        } else {
          try {
            const port = yield startNextJSServer();
            console.log("Next.js server started on port:", port);
            mainWindow == null ? void 0 : mainWindow.loadURL(`http://localhost:${port}`);
          } catch (error) {
            console.error("Error starting Next.js server:", error);
          }
        }
      });
      loadURL();
      return mainWindow;
    };
    var startNextJSServer = () => __async(exports, null, function* () {
      try {
        const nextJSPort = yield getPortPlease.getPort({ portRange: [30011, 5e4] });
        const webDir = path.join(electron.app.getAppPath(), "app");
        yield startServer.startServer({
          dir: webDir,
          isDev: false,
          hostname: "localhost",
          port: nextJSPort,
          customServer: true,
          allowRetry: false,
          keepAliveTimeout: 5e3,
          minimalMode: true
        });
        process.title = "MemeTools";
        return nextJSPort;
      } catch (error) {
        console.error("Error starting Next.js server:", error);
        throw error;
      }
    });
    electron.app.whenReady().then(() => __async(exports, null, function* () {
      createWindow();
      electron.ipcMain.on("ping", () => log__default.default.info("pong"));
      electron.app.on("activate", () => {
        if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
      });
    }));
    electron.app.on("window-all-closed", () => {
      electron.app.quit();
    });
    electron.ipcMain.handle("save-file", (_0, _1) => __async(exports, [_0, _1], function* (event, { buffer, fileName, type }) {
      try {
        const uploadsDir = path__default.default.join(electron.app.getPath("userData"), "uploads");
        yield fs__default.default.promises.mkdir(uploadsDir, { recursive: true });
        const uniqueName = `${Date.now()}-${fileName}`;
        const filePath = path__default.default.join(uploadsDir, uniqueName);
        yield fs__default.default.writeFile(filePath, buffer, (err) => {
          if (err) throw err;
        });
        return {
          success: true,
          path: filePath,
          fileName: uniqueName
        };
      } catch (error) {
        console.error("Error saving file:", error);
        throw error;
      }
    }));
    electron.ipcMain.handle("select-file", () => __async(exports, null, function* () {
      var _a, _b;
      const result = yield electron.dialog.showOpenDialog({
        properties: ["openFile"],
        filters: [
          { name: "Images", extensions: ["jpg", "jpeg", "png", "gif", "webp"] }
        ]
      });
      if (!result.canceled && result.filePaths.length > 0) {
        return {
          path: result.filePaths[0],
          name: ((_b = (_a = result.filePaths[0].split("\\").pop()) == null ? void 0 : _a.split("/")) == null ? void 0 : _b.pop()) || ""
        };
      }
      return null;
    }));
  }
});
var main = require_main();

module.exports = main;

module.exports = exports.default;
