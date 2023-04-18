import type { NextPage } from "next";
import Head from "next/head";
import { HomeView } from "../views";
import {SignMessage} from "../components/SignMessage";
import {SendTransaction} from "../components/SendTransaction";
import SwapForm from "../views/swap/SwapForm";

const Home: NextPage = (props) => {
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
            Swap
          </h1>
          <div className="text-center w-full max-w-sm">

            <SwapForm />

          </div>
        </div>
      </div>

    </div>
  );
};

export default Home;
