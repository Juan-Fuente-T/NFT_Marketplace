import logo from '../logo_3.png';
import pop_logo from '../pop_logo.png';

import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useRouteMatch,
  useParams
} from "react-router-dom";
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import Web3 from 'web3';

function Navbar() {
  const [connected, toggleConnect] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const location = useLocation();
  const [currAddress, updateAddress] = useState('0x');
  const { ethers } = require("ethers");

  
  const updateButton = (isConnected) => {
    const ethereumButton = document.querySelector('.enableEthereumButton');

    if (ethereumButton) {
      const buttonClass = isConnected
        ? 'bg-green-500 hover:bg-green-700'
        : 'bg-blue-500 hover:bg-blue-700';

      ethereumButton.className = `enableEthereumButton ${buttonClass} text-white font-bold py-2 px-4 rounded text-sm`;
    }
  };
 
  async function getAddress() {
    try {
      if (window.ethereum && window.ethereum.isMetaMask) {
        const { ethers } = require("ethers");
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const addr = await signer.getAddress();
        updateAddress(addr);
      } else {
        console.error("MetaMask no está instalado o no se detecta window.ethereum.");
      }
    } catch (error) {
      console.error("Error al obtener la dirección:", error);
    }
  }

const connectMetaMask = () => {
  if (window.ethereum) {
    const web3 = new Web3(window.ethereum);
    window.ethereum.enable()
      .then((accounts) => {
        const address = accounts[0];
        setWalletAddress(address);
        toggleConnect(true); // Actualizar el estado a conectado
      })
      .catch((error) => {
        console.error("Error al habilitar MetaMask:", error);
      });
  } else {
    console.error("MetaMask no está instalado.");
  }
};

  useEffect(() => {
    if (window.ethereum === undefined) return;
  
    const checkConnection = async () => {
      try {
        const isConnected = await window.ethereum.isConnected();
        if (isConnected) {
          getAddress();
          toggleConnect(true);
          updateButton(true);
        }
      } catch (error) {
        console.error('Error al verificar la conexión:', error);
      }
    };
  
    // Agregar un pequeño retraso antes de verificar la conexión
    const timeoutId = setTimeout(() => {
      checkConnection();
    }, 1000);
  
    const handleAccountsChanged = function (accounts) {
      window.location.reload();
    };
  
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    //console.log('Cambio de cuenta:', accounts);
  
    // Limpiar el temporizador en la limpieza del efecto
    return () => {
      clearTimeout(timeoutId);
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, []);

    return (
      <div className="">
        <nav className="w-screen">
          <ul className='flex items-end justify-between py-3 bg-transparent text-white pr-5'>
          <li className='flex items-end ml-5 pb-2'>
            <Link to="/">
            <img src={pop_logo} alt="" width={180} height={120} className="inline-block -mt-2"/>
            <div className='inline-block font-bold text-xl ml-2'>
              POP Exhibition
            </div>
            </Link>
          </li>
          <li className='w-2/6'>
            <ul className='lg:flex justify-between font-bold mr-10 text-lg'>
              {location.pathname === "/" ? 
              <li className='border-b-2 hover:pb-0 p-2'>
                <Link to="/">POP Exhibition</Link>
              </li>
              :
              <li className='hover:border-b-2 hover:pb-0 p-2'>
                <Link to="/">POP Exhibition</Link>
              </li>              
              }
              {location.pathname === "/sellNFT" ? 
              <li className='border-b-2 hover:pb-0 p-2'>
                <Link to="/sellNFT">List My POP</Link>
              </li>
              :
              <li className='hover:border-b-2 hover:pb-0 p-2'>
                <Link to="/sellNFT">List My POP</Link>
              </li>              
              }              
              {location.pathname === "/profile" ? 
              <li className='border-b-2 hover:pb-0 p-2'>
                <Link to="/profile">POP Profile</Link>
              </li>
              :
              <li className='hover:border-b-2 hover:pb-0 p-2'>
                <Link to="/profile">POP Profile</Link>
              </li>              
              }  
              <li>
              <button onClick={connectMetaMask} className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm">{connected ? "Connected" : "Connect Wallet"}</button>
             </li>
            </ul>
          </li>
          </ul>
        </nav>
        <div className='text-white text-bold text-right mr-10 text-sm'>
          {currAddress !== "0x" ? "Connected to":"Not Connected. Please login to view NFTs"} {currAddress !== "0x" ? (currAddress.substring(0,15)+'...'):""}
        </div>
      </div>
    );
  }

  export default Navbar;