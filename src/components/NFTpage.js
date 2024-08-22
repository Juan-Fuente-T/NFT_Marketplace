import Navbar from "./Navbar";
//import axie from "../tile.jpeg";
import { useLocation, useParams } from 'react-router-dom';
import MarketplaceJSON from "../Marketplace.json";
import axios from "axios";
import { useState, useEffect } from "react";
import { GetIpfsUrlFromPinata } from "../utils";
//import { web3 } from "web3";
//import Web3 from 'web3';
//import { ethers } from 'ethers';
//const ethers = require("ethers");


export default function NFTPage(props) {

    const [data, updateData] = useState({});
    const [message, updateMessage] = useState("");
    const [currAddress, updateCurrAddress] = useState("0x");
    const [dataFetched, updateDataFetched] = useState(false);
    const [accounts, setAccounts] = useState([]);

    const params = useParams();
    const tokenId = params.tokenId;

    async function getNFTData(tokenId) {
        const ethers = require("ethers");
        // Verificamos si el usuario está conectado a MetaMask
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await provider.listAccounts();
        const connected = accounts.length > 0;

        // Si el usuario está conectado, obtenemos su dirección
        let addr = "0x";
        if (connected) {
            const signer = provider.getSigner();
            if (typeof signer !== 'undefined' && signer.getAddress instanceof Function) {
                addr = await signer.getAddress();
            } else {
                console.error("signer no es una instancia válida de Signer");
            }
        }

        // Obtenemos el contrato inteligente
        let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, provider);
        console.log("Contract: ", contract);
        console.log("TokenId: ", tokenId);
        // Obtenemos los datos del NFT
        var tokenURI = await contract.tokenURI(tokenId);
        const listedToken = await contract.getListedTokenForId(tokenId);
        tokenURI = GetIpfsUrlFromPinata(tokenURI);
        let meta = await axios.get(tokenURI);
        meta = meta.data;

        let item = {
            price: meta.price,
            tokenId: tokenId,
            seller: listedToken.seller,
            owner: listedToken.owner,
            image: meta.image,
            name: meta.name,
            description: meta.description,
        }

        updateData(item);
        updateDataFetched(true);
        updateCurrAddress(addr);
    }

    useEffect(() => {
        getNFTData(tokenId);
    }, [tokenId]);

    async function buyNFT(tokenId) {
        if (!window.ethereum) {
            alert("MetaMask no está instalado o no está conectado.");
            return;
        }

        try {
            const ethers = require("ethers");
            //After adding your Hardhat network to your metamask, this code will get providers and signers
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            //Pull the deployed contract instance
            console.log("Address y abi:", MarketplaceJSON.address, MarketplaceJSON.abi)
            let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);
            const salePrice = ethers.utils.parseUnits(data.price, 'ether')
            console.log("PRICE", salePrice);
            updateMessage("Buying the NFT... Please Wait (Upto 5 mins)")
            //run the executeSale function
            let transaction = await contract.executeSale(tokenId, { value: salePrice, gasLimit: 500000 });

            await transaction.wait();

            alert('You successfully bought the NFT!');
            updateMessage("");
        }
        catch (e) {
            alert("Upload Error" + e)
        }
    }

    // Add a new state variable for isSeller
    //const [isSeller, updateIsSeller] = useState(false);

    //const params = useParams();
    //const tokenId = params.tokenId;
    //if (!dataFetched)
    //   getNFTData(tokenId);
    if (typeof data.image == "string")
        data.image = GetIpfsUrlFromPinata(data.image);

    useEffect(() => {
        if (window.ethereum) {
            window.ethereum.request({ method: 'eth_accounts' }).then(accounts => {
                setAccounts(accounts);
            });

            window.ethereum.on('accountsChanged', accounts => {
                setAccounts(accounts);
            });
        }
    }, []);

    return (
        <div style={{ "minHeight": "100vh" }}>
            <Navbar></Navbar>
            <div className="flex flex-col items-center m-5" >
                <img src={data?.image} alt="" className="w-4/5 md:w-2/5 rounded-lg" />
                <div className="text-xl break-word m-5 md:mx-20   bg-blue-900 bg-opacity-70  space-y-8 text-white shadow-2xl rounded-lg border-2 p-12 w-4/5 md:w-3/5 overflow-auto" >
                    <div>
                        Name: {data?.name}
                    </div>
                    <div>
                        Description: {data?.description}
                    </div>
                    <div>
                        Price: <span className="">{data?.price + " ETH"}</span>
                    </div>
                    <div>
                        Owner: <span className="text-sm">{data?.owner}</span>
                    </div>
                    <div>
                        Seller: <span className="text-sm">{data.seller}</span>
                    </div>
                    <div >
                        {accounts.length > 0 ?
                            currAddress === data.seller || currAddress === data.owner?
                                    <div className="text-white">You are the owner of this NFT</div>
                                :<button className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm" onClick={() => buyNFT(tokenId)}>Buy this NFT</button>
                            : <div className="text-red-400">Please connect your wallet to buy this NFT</div>
                        }
                        <div className="text-green text-center mt-3">{message}</div>
                    </div>

                </div>
            </div>
        </div>
    )
}

//habria que añadir esta funcion al conytrato y mintearlo de nuevo para que este cambio funcione
/*function reclaimNFT(uint256 _tokenId) public {
    require(msg.sender == owner, "Only the owner can reclaim NFTs");
    _transfer(address(this), msg.sender, _tokenId);
  }*/

/**
 async function buyNFT(tokenId) {
      if (!window.ethereum) {
          alert("MetaMask no está instalado o no está conectado.");
          return;
      }

      try {
          if (window.ethereum) {
              const ethers = require("ethers");
              const provider = new ethers.providers.Web3Provider(window.ethereum);
              const signer = provider.getSigner();
              console.log("Signer:", signer);
              const contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);
              let salePrice;
              if (currAddress === data.seller) {
                  salePrice = 0;
              } else {
                  salePrice = ethers.utils.parseUnits(data.price, 'ether');
              }
              updateMessage("Buying the NFT... Please Wait (Upto 5 mins)")
              let transaction = await contract.executeSale(tokenId, { value: salePrice });
              await transaction.wait();

              // Check if the transaction was successful
              if (transaction.status) {
                  // Update the interface to reflect the change in ownership
                  updateData(prevState => ({
                      ...prevState,
                      owner: currAddress
                  }));
              }

              alert('You successfully bought the NFT!');
              updateMessage("");
          } else {
              alert('Please install MetaMask to purchase this item');
          }
      }
      catch (e) {
          alert("Upload Error" + e)
      }
  }
 */

//Ahora mismo el que mintea se convierte en Seller,  el Owner es quien ha deployado el Marketplace. Si otro user compra el NFT, se convierte en Seller, pero el Owner no cambia, sigue siendo el dueño del markeplace. Tampoco hay manera de retirar el NFT del marketplace(habria que cambiarlo si se quiere que un user retire su NFT en el contrato). Con cada venda el User envia el valor de NFT al pulsar el botón de Comprar. Despues el Marketplace envia al Owner el valor de la comision (listPrice) y envia al Seller el valor del precio de venta menos esa comision, pero creo que hay un error, se debería restar del valor de venta el valor de esa comisión. Si la venta es de 1 ether,si se envia una comision de 0.1 al dueño y 1 al vendedor, no dan las cuentas.
//--------------FUNCION para poder RECLAIM el NFT por el que lo ha minteado gratis-------------
//La idea es que si el User es el seller, pueda reclamar para si mismo el NFT gratis, pero es necesario hacer cambios en el smart contract.
/**
     async function buyNFT(tokenId) {
      if (!window.ethereum) {
          alert("MetaMask no está instalado o no está conectado.");
          return;
      }

      try {
          if (window.ethereum) {
              const ethers = require("ethers");
              //After adding your Hardhat network to your metamask, this code will get providers and signers
              const provider = new ethers.providers.Web3Provider(window.ethereum);
              const signer = provider.getSigner();

              //Pull the deployed contract instance
              let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);
              //const salePrice = web3.utils.toWei(data.price, 'ether');
              let salePrice;
              if (currAddress === data.seller) {
                  salePrice = 0;
              } else {
                  salePrice = ethers.utils.parseUnits(data.price, 'ether')
              }
              updateMessage("Buying the NFT... Please Wait (Upto 5 mins)")
              //run the executeSale function
              let transaction = await contract.executeSale(tokenId, { value: salePrice });
              await transaction.wait();

              // Check if the transaction was successful
              if (transaction.status) {
                  // Update the interface to reflect the change in ownership
                  updateData(prevState => ({
                      ...prevState,
                      owner: currAddress
                  }));
              }

              alert('You successfully bought the NFT!');
              updateMessage("");
          } else {
              alert('Please install a wallet to purchase this item');
          }
      }
      catch (e) {
          alert("Upload Error" + e)
      }
  }
 */

//---------------------------BOTON para reclamar propio NFT gratis--------------------------
/**
  {currAddress !== data.owner && currAddress !== data.seller ?
    accounts.length > 0 ?
        <button className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm" onClick={() => buyNFT(tokenId)}>Buy this NFT</button>
        : <div className="text-red-500">Please connect your wallet to buy this NFT</div>
    : currAddress === data.seller ?
        <>
            <div className="text-white">You are the seller of this NFT</div>
            <button className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm" onClick={() => buyNFT(tokenId)}>Reclaim this NFT for free</button>
        </>
        : <div className="text-white">This NFT is currently for sale</div>
        }
----------variante-----------------

        {currAddress !== data.seller ?
  accounts.length > 0 ?
     <button className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm" onClick={() => buyNFT(tokenId)}>Buy this NFT</button>
     : <div className="text-red-500">Please connect your wallet to buy this NFT</div>
  : currAddress === data.seller ?
     <>
        <div className="text-white">You are the seller of this NFT</div>
        <button className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm" onClick={() => buyNFT(tokenId)}>Reclaim this NFT for free</button>
     </>
     : <div className="text-white">This NFT is currently for sale</div>
}
 */