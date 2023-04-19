import type { NextPage } from "next";
import Head from "next/head";
import SwapForm from "../views/swap/SwapForm";
import {useState} from "react";
import InitSwapForm from "../views/swap/InitSwapForm";
import {useRouter} from "next/router";
import AddLiquid from "../views/swap/AddLiquid";

const Home: NextPage = (props) => {
  const router = useRouter();
  let {tab} = router.query;
  if (!tab) {
    tab = 'swap';
  }
  const setTab = (i) => router.push("/swap?tab=" + i);

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
              <a className={`tab tab-lifted ${tab === 'init' ? 'tab-active' : ''}`} onClick={() => setTab('init')}>Init Pool</a>
              <a className={`tab tab-lifted ${tab === 'add' ? 'tab-active' : ''}`} onClick={() => setTab('add')}>Add Liquidity</a>
              <a className={`tab tab-lifted ${tab === 'swap' ? 'tab-active' : ''}`} onClick={() => setTab('swap')}>Swap</a>
            </div>
            <div className="tab-content w-full max-w-sm">
              {tab === 'init' && <InitSwapForm />}
              {tab === 'add' && <AddLiquid />}
              {tab === 'swap' && <SwapForm />}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Home;
