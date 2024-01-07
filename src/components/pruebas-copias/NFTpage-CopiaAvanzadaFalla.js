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
import { JsonRpcProvider } from 'ethers/providers';
//const ethers = require("ethers");


export default function NFTPage(props) {

    const [data, updateData] = useState({});
    const [message, updateMessage] = useState("");
    const [currAddress, updateCurrAddress] = useState("0x");
    const [dataFetched, updateDataFetched] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

    let provider = null;
    let contract = null;
    useEffect(() => {
        if (window.ethereum && window.ethereum.isConnected()) {
            //provider = new ethers.providers.BrowserProvider(window.ethereum);

            // REACT_APP_ALCHEMY_API_URL = "https://eth-sepolia.g.alchemy.com/v2/4ZbR7CGtwT_92IC7-GKeLsrqsDyI_bo2";
            //REACT_APP_PRIVATE_KEY = "c45f85a5ec0d4bd6c655c9fc2c505c3b6576a9d81e73635f77deb457aa68f3d9";

            const url = process.env.REACT_APP_ALCHEMY_API_URL;
            //const privateKey = process.env.REACT_APP_PRIVATE_KEY;

            //const url = REACT_APP_ALCHEMY_API_URL;
            //provider = new JsonRpcProvider(url);
            provider = new ethers.BrowserProvider(url);
            console.log("Provider: ", provider);
            contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, provider);
            // Obtenemos la clave privada de nuestra cuenta
            //const privateKey = REACT_APP_PRIVATE_KEY;
            // Creamos un Wallet con nuestra clave privada

            // Obtenemos un Signer de nuestro Wallet
            console.log("URL: ", url);
            console.log("contract: ", contract);
            console.log("IsConnected: ", window.ethereum.isConnected());

            // Obtenemos la dirección de la cuenta del usuario
            window.ethereum.request({ method: 'eth_accounts' })
                .then((accounts) => {
                    if (accounts.length === 0) {
                        console.log('No hay cuentas conectadas.');
                        return;
                    }

                    // Usamos la primera cuenta en la lista
                    const account = accounts[0];
                    updateCurrAddress(account);
                    // Creamos un Wallet con la dirección de la cuenta
                    const wallet = new ethers.Wallet(account);

                    // Obtenemos un Signer de nuestro Wallet
                    const signer = wallet.connect(provider);
                    console.log("Signer: ", signer);

                    // Utilizamos el Signer para crear el contrato
                    contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);

                })
                .catch((error) => {
                    console.error("Error al obtener la dirección de la cuenta:", error);
                });
        } else {
            console.error("Metamask no está instalado o habilitado.");
        }
    }, []); // Pasamos un array vacío como segundo argumento para que este efecto solo se ejecute una vez cuando el componente se monta
    useEffect(() => {
        if (provider && contract) {
            getNFTData(tokenId);
        }
    }, [provider, contract]);

    async function getNFTData(tokenId) {
        if (!provider || !contract) {
            console.error("Provider o contract no están definidos.");
            return;
        }


        // Crear una instancia de proveedor utilizando window.ethereum
        //let provider = new ethers.providers.Web3Provider(window.ethereum);
        //let provider = new ethers.providers.Web3BrowserProvider(window.ethereum);
        //let provider = new ethers.providers.Provider(window.ethereum);
        //let provider = new ethers.BrowserProvider(window.ethereum);


        //let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, provider);

        var tokenURI = await contract.tokenURI(tokenId);
        const listedToken = await contract.getListedTokenForId(tokenId);
        tokenURI = GetIpfsUrlFromPinata(tokenURI);
        let meta = await axios.get(tokenURI);
        meta = meta.data;
        //console.log(listedToken);


        let item = {
            price: meta.price,
            tokenId: tokenId,
            seller: listedToken.seller,
            owner: listedToken.owner,
            image: meta.image,
            name: meta.name,
            description: meta.description,
        };

        updateData(item);
        updateDataFetched(true);

        // Verificar si MetaMask está instalado y conectado
        if (window.ethereum) {
            // Obtener el signer
            const signer = provider.getSigner();


            // Actualizar la instancia del contrato con el signer
            contract = contract.connect(signer);

            try {
                // Obtener la dirección del usuario
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });

                if (accounts.length > 0) {
                    const addr = accounts[0];
                    updateCurrAddress(addr);
                } else {
                    // No hay cuentas conectadas en MetaMask
                    console.warn("No hay cuentas conectadas en MetaMask");
                    updateDataFetched(true);
                }
            } catch (error) {
                console.error("Error al interactuar con MetaMask:", error);
                updateDataFetched(true);
            }
        } else {
            // MetaMask no está instalado
            console.error("MetaMask no está instalado.");
            updateDataFetched(true);
        }
    }

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
    // Add a new state variable for isSeller
    const [isSeller, updateIsSeller] = useState(false);

    const params = useParams();
    const tokenId = params.tokenId;
    //if (!dataFetched)
    //   getNFTData(tokenId);
    if (typeof data.image == "string")
        data.image = GetIpfsUrlFromPinata(data.image);

    useEffect(() => {
        if (window.ethereum) {
            window.ethereum.request({ method: 'eth_accounts' }).then(accounts => {
                setIsConnected(accounts.length > 0);
            });

            window.ethereum.on('accountsChanged', accounts => {
                setIsConnected(accounts.length > 0);
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
                            isConnected ?
                                <button className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm" onClick={() => buyNFT(tokenId)}>Buy this NFT</button>
                                : <div className="text-red-500">Please connect your wallet to buy this NFT</div>
                            : <div className="text-white">You are the owner of this NFT</div>
                        }
                        <div className="text-green text-center mt-3">{message}</div>
                    </div>

                </div>
            </div>
        </div>
    )
}