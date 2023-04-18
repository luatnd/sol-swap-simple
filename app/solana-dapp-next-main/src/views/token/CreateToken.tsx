import {useWallet} from "@solana/wallet-adapter-react";

type Props = {}
export default function CreateToken(props: Props) {
  const { publicKey, sendTransaction } = useWallet();

  return (
    <div className="CreateTokenForm">
      <form action="#">
        <div className="mt-6 mb-6 leading-10">
          You're going to create a new token on <b>devnet</b><br/>
          <b>name</b> <input type="text" placeholder="Luat Galaxy" className="input input-bordered mr-2 w-28" />
          and <b>symbol</b> <input type="text" placeholder="LUAT" className="input input-bordered mr-2 w-20" /><br/>
          with 9 <b>decimals</b><br/>
          and <b>metadata uri</b> <input type="text" placeholder="https://" className="input input-bordered mr-2 w-28" /><br/>
          <b>initial supply</b> will be <input type="number" placeholder="1000" className="input input-bordered mr-2 w-28" /><br/>
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
            Create
          </div>
        </button>
      </form>
    </div>
  );
};
