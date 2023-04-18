import {useWallet} from "@solana/wallet-adapter-react";

type Props = {}
export default function TransferToken(props: Props) {
  const { publicKey, sendTransaction } = useWallet();

  return (
    <div className="CreateTokenForm">

      <form action="#">
        <div className="content-center">
          <div className="mt-6 mb-6 text-left leading-10">
            You're going to transfer<br/>
            <input type="number" placeholder="1000" required className="input input-bordered mr-2 w-28" /> <b>LUAT</b><br/>
            from <b>your wallet</b><br/>
            to the <b>recipient wallet</b> <input type="text" placeholder="" required className="input input-bordered mr-2 w-28" /><br/>
            You will be the tx fee payer.
          </div>
        </div>

        <button
          type="submit"
          className="group w-60 m-2 btn animate-pulse disabled:animate-none bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:from-pink-500 hover:to-yellow-500 ... "
          onClick={() => {}} disabled={!publicKey}
        >
          <div className="hidden group-disabled:block ">
            Wallet not connected
          </div>
          <div className="block group-disabled:hidden">
            Transfer
          </div>
        </button>
      </form>
    </div>
  );
};
