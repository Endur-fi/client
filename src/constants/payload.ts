// paymaster body payloads recorded to add guards for paymaster requests

const deploy = {
  id: 1,
  jsonrpc: "2.0",
  method: "paymaster_buildTransaction",
  params: {
    transaction: {
      type: "deploy",
      deployment: {
        address:
          "0x06051a7715ada8fb173b6871fc33f3da776e398fe70eaaab7e1fe6a3619294a3",
        class_hash:
          "0x073414441639dcd11d1846f287650a00c60c416b9d3ba45d31c651672125b2c2",
        salt: "0x3176205707bbaf12061279c94b635b6c4e0e465d810479b13321cd2835e41de",
        calldata: [
          "0x0",
          "0x3176205707bbaf12061279c94b635b6c4e0e465d810479b13321cd2835e41de",
          "0x1",
        ],
        version: 1,
      },
    },
    parameters: { version: "0x1", fee_mode: { mode: "sponsored" } },
  },
};

const stakeWithHyper = {
  id: 1,
  jsonrpc: "2.0",
  method: "paymaster_buildTransaction",
  params: {
    transaction: {
      type: "invoke",
      invoke: {
        user_address:
          "0x05564504509678f95b9045d83621d2c4f79323d3c3b1015ab43586baa49199aa",
        calls: [
          {
            to: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
            selector:
              "0x219209e083275171774dab1df80982e9df2096516f06319c5c6d71ae0a8480c",
            calldata: [
              "0x28d709c875c0ceac3dce7065bec5328186dc89fe254527084d1689910954b0a",
              "0x6f05b59d3b20000",
              "0x0",
            ],
          },
          {
            to: "0x028d709c875c0ceac3dce7065bec5328186dc89fe254527084d1689910954b0a",
            selector:
              "0xc73f681176fc7b3f9693986fd7b14581e8d540519e27400e88b8713932be01",
            calldata: [
              "0x6f05b59d3b20000",
              "0x0",
              "0x5564504509678f95b9045d83621d2c4f79323d3c3b1015ab43586baa49199aa",
            ],
          },
          {
            to: "0x028d709c875c0ceac3dce7065bec5328186dc89fe254527084d1689910954b0a",
            selector:
              "0x219209e083275171774dab1df80982e9df2096516f06319c5c6d71ae0a8480c",
            calldata: [
              "0x46c7a54c82b1fe374353859f554a40b8bd31d3e30f742901579e7b57b1b5960",
              "0x609afb2da2971f5",
              "0x0",
            ],
          },
          {
            to: "0x046c7a54c82b1fe374353859f554a40b8bd31d3e30f742901579e7b57b1b5960",
            selector:
              "0xc73f681176fc7b3f9693986fd7b14581e8d540519e27400e88b8713932be01",
            calldata: [
              "0x609afb2da2971f5",
              "0x0",
              "0x5564504509678f95b9045d83621d2c4f79323d3c3b1015ab43586baa49199aa",
            ],
          },
        ],
      },
    },
    parameters: { version: "0x1", fee_mode: { mode: "sponsored" } },
  },
};

const stake = {
  id: 1,
  jsonrpc: "2.0",
  method: "paymaster_buildTransaction",
  params: {
    transaction: {
      type: "invoke",
      invoke: {
        user_address:
          "0x05564504509678f95b9045d83621d2c4f79323d3c3b1015ab43586baa49199aa",
        calls: [
          {
            to: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
            selector:
              "0x219209e083275171774dab1df80982e9df2096516f06319c5c6d71ae0a8480c",
            calldata: [
              "0x28d709c875c0ceac3dce7065bec5328186dc89fe254527084d1689910954b0a",
              "0x6f05b59d3b20000",
              "0x0",
            ],
          },
          {
            to: "0x028d709c875c0ceac3dce7065bec5328186dc89fe254527084d1689910954b0a",
            selector:
              "0xc73f681176fc7b3f9693986fd7b14581e8d540519e27400e88b8713932be01",
            calldata: [
              "0x6f05b59d3b20000",
              "0x0",
              "0x5564504509678f95b9045d83621d2c4f79323d3c3b1015ab43586baa49199aa",
            ],
          },
        ],
      },
    },
    parameters: { version: "0x1", fee_mode: { mode: "sponsored" } },
  },
};

const executeAfterStake = {
  id: 2,
  jsonrpc: "2.0",
  method: "paymaster_executeTransaction",
  params: {
    transaction: {
      type: "invoke",
      invoke: {
        user_address:
          "0x05564504509678f95b9045d83621d2c4f79323d3c3b1015ab43586baa49199aa",
        typed_data: {
          types: {
            StarknetDomain: [
              { name: "name", type: "shortstring" },
              { name: "version", type: "shortstring" },
              { name: "chainId", type: "shortstring" },
              { name: "revision", type: "shortstring" },
            ],
            OutsideExecution: [
              { name: "Caller", type: "ContractAddress" },
              { name: "Nonce", type: "felt" },
              { name: "Execute After", type: "u128" },
              { name: "Execute Before", type: "u128" },
              { name: "Calls", type: "Call*" },
            ],
            Call: [
              { name: "To", type: "ContractAddress" },
              { name: "Selector", type: "selector" },
              { name: "Calldata", type: "felt*" },
            ],
          },
          domain: {
            name: "Account.execute_from_outside",
            version: "2",
            chainId: "SN_MAIN",
            revision: "1",
          },
          primaryType: "OutsideExecution",
          message: {
            Caller:
              "0x127021a1b5a52d3174c2ab077c2b043c80369250d29428cee956d76ee51584f",
            Nonce: "0xbdf8e7f86514d7bc284a56395d373a01",
            "Execute After": "0x1",
            "Execute Before": "0x69ef2a60",
            Calls: [
              {
                To: "0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
                Selector:
                  "0x219209e083275171774dab1df80982e9df2096516f06319c5c6d71ae0a8480c",
                Calldata: [
                  "0x28d709c875c0ceac3dce7065bec5328186dc89fe254527084d1689910954b0a",
                  "0x6f05b59d3b20000",
                  "0x0",
                ],
              },
              {
                To: "0x28d709c875c0ceac3dce7065bec5328186dc89fe254527084d1689910954b0a",
                Selector:
                  "0xc73f681176fc7b3f9693986fd7b14581e8d540519e27400e88b8713932be01",
                Calldata: [
                  "0x6f05b59d3b20000",
                  "0x0",
                  "0x5564504509678f95b9045d83621d2c4f79323d3c3b1015ab43586baa49199aa",
                ],
              },
            ],
          },
        },
        signature: [
          "0x62f6023402d8cae1db59a5e3c18ff6f7b1b7b1046f765ecca19359ba0cfee17",
          "0x3b467018d1d82d461f3826782d94aadbc8a4d8a9277de4f30a20e6930e487c6",
        ],
      },
    },
    parameters: { version: "0x1", fee_mode: { mode: "sponsored" } },
  },
};

const unstakeEndur = {
  id: 1,
  jsonrpc: "2.0",
  method: "paymaster_buildTransaction",
  params: {
    transaction: {
      type: "invoke",
      invoke: {
        user_address:
          "0x05564504509678f95b9045d83621d2c4f79323d3c3b1015ab43586baa49199aa",
        calls: [
          {
            to: "0x028d709c875c0ceac3dce7065bec5328186dc89fe254527084d1689910954b0a",
            selector:
              "0x2ef0a97332ad048ac544d8dfacdd43e128b9816d599fdd0310960904fa18609",
            calldata: [
              "0x609afb2d990db80",
              "0x0",
              "0x5564504509678f95b9045d83621d2c4f79323d3c3b1015ab43586baa49199aa",
              "0x5564504509678f95b9045d83621d2c4f79323d3c3b1015ab43586baa49199aa",
            ],
          },
        ],
      },
    },
    parameters: { version: "0x1", fee_mode: { mode: "sponsored" } },
  },
};

const executeAfterUnstake = {
  id: 2,
  jsonrpc: "2.0",
  method: "paymaster_executeTransaction",
  params: {
    transaction: {
      type: "invoke",
      invoke: {
        user_address:
          "0x05564504509678f95b9045d83621d2c4f79323d3c3b1015ab43586baa49199aa",
        typed_data: {
          types: {
            StarknetDomain: [
              { name: "name", type: "shortstring" },
              { name: "version", type: "shortstring" },
              { name: "chainId", type: "shortstring" },
              { name: "revision", type: "shortstring" },
            ],
            OutsideExecution: [
              { name: "Caller", type: "ContractAddress" },
              { name: "Nonce", type: "felt" },
              { name: "Execute After", type: "u128" },
              { name: "Execute Before", type: "u128" },
              { name: "Calls", type: "Call*" },
            ],
            Call: [
              { name: "To", type: "ContractAddress" },
              { name: "Selector", type: "selector" },
              { name: "Calldata", type: "felt*" },
            ],
          },
          domain: {
            name: "Account.execute_from_outside",
            version: "2",
            chainId: "SN_MAIN",
            revision: "1",
          },
          primaryType: "OutsideExecution",
          message: {
            Caller:
              "0x127021a1b5a52d3174c2ab077c2b043c80369250d29428cee956d76ee51584f",
            Nonce: "0x87b1532ef410b995a046d1e256851bbd",
            "Execute After": "0x1",
            "Execute Before": "0x69ef2b44",
            Calls: [
              {
                To: "0x28d709c875c0ceac3dce7065bec5328186dc89fe254527084d1689910954b0a",
                Selector:
                  "0x2ef0a97332ad048ac544d8dfacdd43e128b9816d599fdd0310960904fa18609",
                Calldata: [
                  "0x609afb2d990db80",
                  "0x0",
                  "0x5564504509678f95b9045d83621d2c4f79323d3c3b1015ab43586baa49199aa",
                  "0x5564504509678f95b9045d83621d2c4f79323d3c3b1015ab43586baa49199aa",
                ],
              },
            ],
          },
        },
        signature: [
          "0x65b2795a1a82490d7cf625f64890c649118403d367ea81b24496e115301991",
          "0x1ef54d7dff69959140400d72d43e586ad1530468e67fe6515cc923e87a84d3b",
        ],
      },
    },
    parameters: { version: "0x1", fee_mode: { mode: "sponsored" } },
  },
};

const unstakeAvnu = {
  id: 1,
  jsonrpc: "2.0",
  method: "paymaster_buildTransaction",
  params: {
    transaction: {
      type: "invoke",
      invoke: {
        user_address:
          "0x05564504509678f95b9045d83621d2c4f79323d3c3b1015ab43586baa49199aa",
        calls: [
          {
            to: "0x28d709c875c0ceac3dce7065bec5328186dc89fe254527084d1689910954b0a",
            selector:
              "0x219209e083275171774dab1df80982e9df2096516f06319c5c6d71ae0a8480c",
            calldata: [
              "0x4270219d365d6b017231b52e92b3fb5d7c8378b05e9abc97724537a80e93b0f",
              "0x609afb2da297200",
              "0x0",
            ],
          },
          {
            to: "0x4270219d365d6b017231b52e92b3fb5d7c8378b05e9abc97724537a80e93b0f",
            selector:
              "0x1171593aa5bdadda4d6b0efde6cc94ee7649c3163d5efeb19da6c16d63a2a63",
            calldata: [
              "0x28d709c875c0ceac3dce7065bec5328186dc89fe254527084d1689910954b0a",
              "0x609afb2da297200",
              "0x0",
              "0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
              "0x6ee6d6033141900",
              "0x0",
              "0x695b4b4fd5317c0",
              "0x0",
              "0x5564504509678f95b9045d83621d2c4f79323d3c3b1015ab43586baa49199aa",
              "0x3",
              "0x66c76374a9adb11d4d283ac400331ec6a691c61029168bd70cea5d97dfc971",
              "0x1",
              "0x28d709c875c0ceac3dce7065bec5328186dc89fe254527084d1689910954b0a",
              "0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
              "0x5dd3d2f4429af886cd1a3b08289dbcea99a294197e9eb43b0e0325b4b",
              "0xe8d4a51000",
              "0x6",
              "0x28d709c875c0ceac3dce7065bec5328186dc89fe254527084d1689910954b0a",
              "0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
              "0x20c49ba5e353f80000000000000000",
              "0x56a4c",
              "0x43e4f09c32d13d43a880e85f69f7de93ceda62d6cf2581a582c6db635548fdc",
              "0x17c7c5da91894d000000000000000000000",
            ],
          },
        ],
      },
    },
    parameters: { version: "0x1", fee_mode: { mode: "sponsored" } },
  },
};

const executeAfterUnstakeAvnu = {
  id: 2,
  jsonrpc: "2.0",
  method: "paymaster_executeTransaction",
  params: {
    transaction: {
      type: "invoke",
      invoke: {
        user_address:
          "0x05564504509678f95b9045d83621d2c4f79323d3c3b1015ab43586baa49199aa",
        typed_data: {
          types: {
            StarknetDomain: [
              { name: "name", type: "shortstring" },
              { name: "version", type: "shortstring" },
              { name: "chainId", type: "shortstring" },
              { name: "revision", type: "shortstring" },
            ],
            OutsideExecution: [
              { name: "Caller", type: "ContractAddress" },
              { name: "Nonce", type: "felt" },
              { name: "Execute After", type: "u128" },
              { name: "Execute Before", type: "u128" },
              { name: "Calls", type: "Call*" },
            ],
            Call: [
              { name: "To", type: "ContractAddress" },
              { name: "Selector", type: "selector" },
              { name: "Calldata", type: "felt*" },
            ],
          },
          domain: {
            name: "Account.execute_from_outside",
            version: "2",
            chainId: "SN_MAIN",
            revision: "1",
          },
          primaryType: "OutsideExecution",
          message: {
            Caller:
              "0x127021a1b5a52d3174c2ab077c2b043c80369250d29428cee956d76ee51584f",
            Nonce: "0xa38d7386967cee99b14bf966c89f4e25",
            "Execute After": "0x1",
            "Execute Before": "0x69ef2beb",
            Calls: [
              {
                To: "0x28d709c875c0ceac3dce7065bec5328186dc89fe254527084d1689910954b0a",
                Selector:
                  "0x219209e083275171774dab1df80982e9df2096516f06319c5c6d71ae0a8480c",
                Calldata: [
                  "0x4270219d365d6b017231b52e92b3fb5d7c8378b05e9abc97724537a80e93b0f",
                  "0x609afb2da297200",
                  "0x0",
                ],
              },
              {
                To: "0x4270219d365d6b017231b52e92b3fb5d7c8378b05e9abc97724537a80e93b0f",
                Selector:
                  "0x1171593aa5bdadda4d6b0efde6cc94ee7649c3163d5efeb19da6c16d63a2a63",
                Calldata: [
                  "0x28d709c875c0ceac3dce7065bec5328186dc89fe254527084d1689910954b0a",
                  "0x609afb2da297200",
                  "0x0",
                  "0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
                  "0x6ee6d6033141900",
                  "0x0",
                  "0x695b4b4fd5317c0",
                  "0x0",
                  "0x5564504509678f95b9045d83621d2c4f79323d3c3b1015ab43586baa49199aa",
                  "0x3",
                  "0x66c76374a9adb11d4d283ac400331ec6a691c61029168bd70cea5d97dfc971",
                  "0x1",
                  "0x28d709c875c0ceac3dce7065bec5328186dc89fe254527084d1689910954b0a",
                  "0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
                  "0x5dd3d2f4429af886cd1a3b08289dbcea99a294197e9eb43b0e0325b4b",
                  "0xe8d4a51000",
                  "0x6",
                  "0x28d709c875c0ceac3dce7065bec5328186dc89fe254527084d1689910954b0a",
                  "0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
                  "0x20c49ba5e353f80000000000000000",
                  "0x56a4c",
                  "0x43e4f09c32d13d43a880e85f69f7de93ceda62d6cf2581a582c6db635548fdc",
                  "0x17c7c5da91894d000000000000000000000",
                ],
              },
            ],
          },
        },
        signature: [
          "0x709e2332dada4f4cdc03df754897a3d29572a96e319e51461e5369a35135a6b",
          "0xf3e23247115fd8575b15f3e49b17bb64d5ab7c68cab7fa86275d52622f00f",
        ],
      },
    },
    parameters: { version: "0x1", fee_mode: { mode: "sponsored" } },
  },
};
