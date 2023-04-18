import type { NextPage } from "next";
import Head from "next/head";
import { HomeView } from "../views";
import {SignMessage} from "../components/SignMessage";
import {SendTransaction} from "../components/SendTransaction";
import {useState} from "react";
import CreateToken from "../views/token/CreateToken";
import AirdropToken from "../views/token/AirdropToken";
import TransferToken from "../views/token/TransferToken";

const Home: NextPage = (props) => {
  // new state.tab
  const [tab, setTab] = useState(0);

  return (
    <div>
      <Head>
        <title>Token</title>
        <meta
          name="description"
          content="Solana Scaffold"
        />
      </Head>

      <div className="md:hero mx-auto p-4">
        <div className="md:hero-content flex flex-col">
          <h1 className="text-center text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-tr from-[#9945FF] to-[#14F195]">
            Token
          </h1>
          <div className="text-center">
            <div className="tabs">
              <a className={`tab tab-lifted ${tab === 0 ? 'tab-active' : ''}`} onClick={() => setTab(0)}>Create token</a>
              <a className={`tab tab-lifted ${tab === 1 ? 'tab-active' : ''}`} onClick={() => setTab(1)}>Airdrop</a>
              <a className={`tab tab-lifted ${tab === 2 ? 'tab-active' : ''}`} onClick={() => setTab(2)}>Transfer</a>
            </div>
            <div className="tab-content">
              {tab === 0 && <CreateToken />}
              {tab === 1 && <AirdropToken />}
              {tab === 2 && <TransferToken />}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Home;
