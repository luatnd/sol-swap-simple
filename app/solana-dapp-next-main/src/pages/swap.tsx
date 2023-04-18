import type { NextPage } from "next";
import Head from "next/head";
import SwapForm from "../views/swap/SwapForm";
import {useState} from "react";
import InitSwapForm from "../views/swap/InitSwapForm";

const Home: NextPage = (props) => {
  const [tab, setTab] = useState(0);

  return (
    <div>
      <Head>
        <title>Token Swap</title>
        <meta
          name="description"
          content="Solana Scaffold"
        />
      </Head>

      <div className="md:hero mx-auto p-4">
        <div className="md:hero-content flex flex-col">
          <h1 className="text-center text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-tr from-[#9945FF] to-[#14F195]">
            Swap
          </h1>
          <div className="text-center w-full max-w-sm">
            <div className="tabs">
              <a className={`tab tab-lifted ${tab === 0 ? 'tab-active' : ''}`} onClick={() => setTab(0)}>Liquidity Pool</a>
              <a className={`tab tab-lifted ${tab === 1 ? 'tab-active' : ''}`} onClick={() => setTab(1)}>Swap</a>
            </div>
            <div className="tab-content w-full max-w-sm">
              {tab === 0 && <InitSwapForm />}
              {tab === 1 && <SwapForm />}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Home;
