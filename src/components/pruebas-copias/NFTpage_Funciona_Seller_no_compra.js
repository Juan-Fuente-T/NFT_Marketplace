import Navbar from "../Navbar";
import axie from "../tile.jpeg";
import { useLocation, useParams } from 'react-router-dom';
import MarketplaceJSON from "../../Marketplace.json";
import axios from "axios";
import { useState, useEffect } from "react";
import { GetIpfsUrlFromPinata } from "../../utils";
//import { web3 } from "web3";
import Web3 from 'web3';
import { ethers } from 'ethers';
//import { JsonRpcProvider } from 'ethers/providers';
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
            if (window.ethereum) {
                const web3 = new Web3(window.ethereum);
                const contract = new web3.eth.Contract(MarketplaceJSON.abi, MarketplaceJSON.address);
                const salePrice = web3.utils.toWei(data.price, 'ether');
                updateMessage("Buying the NFT... Please Wait (Upto 5 mins)")
                //run the executeSale function
                let transaction = await contract.methods.executeSale(tokenId).send({ from: currAddress, value: salePrice });

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
    async function reclaimNFT(tokenId) {
        if (!window.ethereum) {
            alert("MetaMask no está instalado o no está conectado.");
            return;
        }

        try {
            if (window.ethereum) {
                const web3 = new Web3(window.ethereum);
                const contract = new web3.eth.Contract(MarketplaceJSON.abi, MarketplaceJSON.address);
                const salePrice = web3.utils.toWei(data.price, 'ether');
                updateMessage("Buying the NFT... Please Wait (Upto 5 mins)")
                //run the executeSale function
                let transaction = await contract.methods.executeSale(tokenId).send({ from: currAddress, value: salePrice });

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
    // Add a new state variable for isSeller
    const [isSeller, updateIsSeller] = useState(false);

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
                <img src={data.image} alt="" className="w-4/5 md:w-2/5 rounded-lg" />
                <div className="text-xl break-word m-5 md:mx-20   bg-blue-900 bg-opacity-70  space-y-8 text-white shadow-2xl rounded-lg border-2 p-12 w-4/5 md:w-3/5 overflow-auto" >
                    <div>
                        Name: {data.name}
                    </div>
                    <div>
                        Description: {data.description}
                    </div>
                    <div>
                        Price: <span className="">{data.price + " ETH"}</span>
                    </div>
                    <div>
                        Owner: <span className="text-sm">{data.owner}</span>
                    </div>
                    <div>
                        Seller: <span className="text-sm">{data.seller}</span>
                    </div>
                    <div >
                        {currAddress != data.owner && currAddress != data.seller ?
                            accounts.length > 0 ?
                                <button className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm" onClick={() => buyNFT(tokenId)}>Buy this NFT</button>
                                : <div className="text-red-500">Please connect your wallet to buy this NFT</div>
                            : <div className="text-white">You are the seller of this NFT</div>
                        }

                        <div className="text-green text-center mt-3">{message}</div>
                    </div>

                </div>
            </div>
        </div>
    )
}