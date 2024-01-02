import Navbar from "./Navbar";
import NFTTile from "./NFTTile";
import MarketplaceJSON from "../Marketplace.json";
import axios from "axios";
import { useState, useEffect } from "react";
import { GetIpfsUrlFromPinata } from "../utils";
import Web3 from 'web3';

export default function Marketplace() {
  const [data, updateData] = useState([]);
  const [walletAddress, setWalletAddress] = useState(null);
  const [connected, toggleConnect] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {

      // Realizar la llamada al contrato para obtener todos los NFT
      const web3 = new Web3(window.ethereum);
      const contract = new web3.eth.Contract(MarketplaceJSON.abi, MarketplaceJSON.address);

      // Obtener el número total de NFTs
      const nftCount = await contract.methods.getCurrentToken().call();

      // Obtener la lista de todos los NFTs
      const allNFTs = await contract.methods.getAllNFTs().call();

      // Procesar los NFT y actualizar el estado
      const nftData = await Promise.all(allNFTs.map(async (item) => {
        const tokenURI = await contract.methods.tokenURI(item.tokenId).call();
        const meta = await axios.get(tokenURI);
        return {
          tokenId: item.tokenId,
          image: meta.data.image,
          name: meta.data.name,
          description: meta.data.description,
          price: item.price,
        };
      }));
      updateData(nftData);

      // Verificar si hay una cuenta conectada
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });

      if (accounts.length > 0) {
        const address = accounts[0];
        setWalletAddress(address);
        toggleConnect(true);
      } else {
        setWalletAddress(null);
        toggleConnect(false);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const connectMetaMask = () => {
    try {
      if (window.ethereum) {
        /* eslint-disable no-unused-vars */
        // const web3 = new Web3(window.ethereum);
        window.ethereum.enable()
          .then((accounts) => {
            if (accounts.length > 0) {
              const address = accounts[0];
              setWalletAddress(address);
              toggleConnect(true);
            } else {
              console.error("No se seleccionó ninguna cuenta en MetaMask.");
              setWalletAddress(null);
              toggleConnect(false);
            }
          })
          .catch((error) => {
            console.error("Error al habilitar MetaMask:", error);
            setWalletAddress(null);
            toggleConnect(false);
            setError("Error al conectar con MetaMask");
          });
      } else {
        console.error("MetaMask no está instalado.");
        setWalletAddress(null);
        toggleConnect(false);
        setLoading(false);
        setError("MetaMask no está instalado.");
      }
    } catch (error) {
      console.error("Error en connectMetaMask:", error);
      setWalletAddress(null);
      toggleConnect(false);
      setError("Error en connectMetaMask");
    }
  };


  return (
    <div>
      <Navbar></Navbar>
      <div className="flex flex-col place-items-center m-10 mt-20">
        <div className="md:text-xl font-bold text-white">
          POPs
        </div>
        <div className="flex mt-5 justify-between flex-wrap max-w-screen-xl text-center">
          {data.map((value, index) => {
            return <NFTTile data={value} key={index}></NFTTile>;
          })}
        </div>
        <div className="flex mt-5 text-center text-white mt-12 mb-12" >
          {walletAddress && (
            <p>Wallet Address: {(walletAddress.substring(0, 15) + '...')}</p>
          )}
          {!walletAddress && (
            <div>
              <p className="flex mt-5 justify-between flex-wrap max-w-screen-xl text-center text-white">Connect Your Wallet </p>
              <button onClick={connectMetaMask} className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm mb-10">{connected ? "Connected" : "Connect"}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}