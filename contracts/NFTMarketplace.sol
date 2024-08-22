//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.19;

//Console functions to help debug the smart contract just like in Javascript
//import "hardhat/console.sol";s
import "../lib/forge-std/src/Test.sol";
//OpenZeppelin's NFT Standard Contracts. We will extend functions from this in our implementation
import "../node_modules/@openzeppelin/contracts/utils/Counters.sol";
import "../node_modules/@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "../node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Initializable} from "../node_modules/@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "../node_modules/@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

////////////////////////////////////////////////////////////
///                Marketplace Garden Tech               ///
////////////////////////////////////////////////////////////

/**
 * @title NFTMarketplace
 * @dev A marketplace for creating, listing, and selling NFTs.
 * This contract extends ERC721URIStorage, allowing for the creation and management of NFTs.
 */
contract NFTMarketplace is ERC721URIStorage, UUPSUpgradeable, Initializable {
    ////////////////////////////////////////////////////////////////
    ///                         Variables                        ///
    ////////////////////////////////////////////////////////////////
    using Counters for Counters.Counter;
    //_tokenIds variable has the most recent minted tokenId
    Counters.Counter private _tokenIds;
    //Keeps track of the number of items sold on the marketplace
    Counters.Counter private _itemsSold;
    //owner is the contract address that created the smart contract
    address payable owner;
    //The fee charged by the marketplace to be allowed to list an NFT
    uint256 listPrice = 0.01 ether;

    //The structure to store info about a listed token
    struct ListedToken {
        uint256 tokenId;
        uint256 price;
        address payable owner;
        address payable seller;
        bool currentlyListed;
    }
    //This mapping maps tokenId to token info and is helpful when retrieving details about a tokenId
    mapping(uint256 => ListedToken) private idToListedToken;

    ////////////////////////////////////////////////////////////////
    ///                          Events                          ///
    ////////////////////////////////////////////////////////////////

    /**
     * @dev Structure to store information about a listed token.
     */
    event TokenListedSuccess(
        uint256 indexed tokenId,
        address owner,
        address seller,
        uint256 price,
        bool currentlyListed
    );

    ////////////////////////////////////////////////////////////////
    ///                         Errors                           ///
    ////////////////////////////////////////////////////////////////

    error InsufficientPrice();
    error IsNotListPrice();
    error NotOwner();

    ////////////////////////////////////////////////////////////////
    ///                        Constructor                       ///
    ////////////////////////////////////////////////////////////////

    constructor() ERC721("NFTMarketplace", "NFTM") {
        owner = payable(msg.sender);
    }

    ////////////////////////////////////////////////////////////////
    ///              Functions for Implementation                ///
    ////////////////////////////////////////////////////////////////
    /**
     * @dev Function to initialize the proxy.
     * @param _marketplaceName The Name of the marketplace
     * @notice With the initialize we don´t need constructor
     * @notice that is the owner of the proxy, not this implementation
     */
    function initialize(string memory _marketplaceName) external initializer {
        owner = msg.sender;
        marketplaceName = _marketplaceName;
    }

    /**
     * @dev Internal function to authorize the upgrade of the implementation contract.
     * @param newImplementation The address of the new implementation contract.
     * @notice You can add any authorization logic for the upgrade of the implementation.
     *         It´s limit by the modifier only to the owner.
     */
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {
        // Posible lógica de autorización para la actualización de la implementación
    }
    ////////////////////////////////////////////////////////////////
    ///                     Token Function                      ///
    ////////////////////////////////////////////////////////////////

    /**
     * @notice Creates a new token and lists it for sale.
     * @dev Mints a new NFT and maps it to a tokenURI.
     * @param tokenURI The URI of the NFT metadata.
     * @param price The price to list the NFT at.
     * @return The new tokenId.
     */
    function createToken(
        string memory tokenURI,
        uint256 price
    ) public payable returns (uint256) {
        //Increment the tokenId counter, which is keeping track of the number of minted NFTs
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        //Mint the NFT with tokenId newTokenId to the address who called createToken
        console.log("Sender", msg.sender);
        _safeMint(msg.sender, newTokenId);

        //Map the tokenId to the tokenURI (which is an IPFS URL with the NFT metadata)
        _setTokenURI(newTokenId, tokenURI);

        //Helper function to update Global variables and emit an event
        createListedToken(newTokenId, price);

        return newTokenId;
    }

    ////////////////////////////////////////////////////////////////
    ///                    Helper Functions                      ///
    ////////////////////////////////////////////////////////////////

    /**
     * @notice Updates the listing price for NFTs.
     * @dev Only the contract owner can update the listing price.
     * @param _listPrice The new listing price.
     */
    function updateListPrice(uint256 _listPrice) public payable {
        if (msg.sender != owner) {
            revert NotOwner();
        }
        listPrice = _listPrice;
    }

    /**
     * @notice Retrieves the current listing price for NFTs.
     * @return The current listing price.
     */
    function getListPrice() public view returns (uint256) {
        return listPrice;
    }

    /**
     * @notice Retrieves the current listing price for NFTs.
     * @return The current listing price.
     */
    function getLatestIdToListedToken()
        public
        view
        returns (ListedToken memory)
    {
        uint256 currentTokenId = _tokenIds.current();
        return idToListedToken[currentTokenId];
    }

    /**
     * @notice Retrieves the details of a listed token by its ID.
     * @param tokenId The ID of the token.
     * @return The details of the listed token.
     */
    function getListedTokenForId(
        uint256 tokenId
    ) public view returns (ListedToken memory) {
        return idToListedToken[tokenId];
    }
    /**
     * @notice Retrieves the current token ID.
     * @return The current token ID.
     */
    function getCurrentToken() public view returns (uint256) {
        return _tokenIds.current();
    }

    /**
     * @dev Helper function to create a listed token.
     * @param tokenId The ID of the token to list.
     * @param price The price to list the token at.
     */
    function createListedToken(uint256 tokenId, uint256 price) private {
        //Make sure the sender sent enough ETH to pay for listing
        if (msg.value != listPrice) {
            revert IsNotListPrice();
        }
        //Just sanity check
        if (price == 0) {
            revert InsufficientPrice();
        }

        //Update the mapping of tokenId's to Token details, useful for retrieval functions
        idToListedToken[tokenId] = ListedToken(
            tokenId,
            price,
            payable(address(this)),
            payable(msg.sender),
            true
        );

        _transfer(msg.sender, address(this), tokenId);
        //Emit the event for successful transfer. The frontend parses this message and updates the end user
        emit TokenListedSuccess(
            tokenId,
            address(this),
            msg.sender,
            price,
            true
        );
    }

    /**
     * @notice Returns all the NFTs currently listed for sale on the marketplace.
     * @dev This function iterates over all token IDs and returns an array of ListedToken objects
     * for tokens that are currently listed.
     * @return An array of ListedToken objects representing all NFTs currently listed for sale.
     */
    function getAllNFTs() public view returns (ListedToken[] memory) {
        uint256 nftCount = _tokenIds.current();
        ListedToken[] memory tokens = new ListedToken[](nftCount);
        uint256 currentIndex = 0;

        //at the moment currentlyListed is true for all, if it becomes false in the future we will
        //filter out currentlyListed == false over here
        for (uint256 i; i < nftCount; ) {
            uint256 currentId = i++;
            ListedToken storage currentItem = idToListedToken[currenId];
            tokens[currentIndex] = currentItem;
            currentIndex++;
            unchecked {
                i++;
            }
        }
        //the array 'tokens' has the list of all NFTs in the marketplace
        return tokens;
    }

    /**
     * @notice Returns all the NFTs that the current user is the owner or seller of.
     * @dev This function filters the NFTs listed on the marketplace to return only those
     * owned or sold by the current user.
     * @return An array of ListedToken objects representing all NFTs owned or sold by the current user.
     */
    function getMyNFTs() public view returns (ListedToken[] memory) {
        uint256 totalItemCount = _tokenIds.current();
        uint256 itemCount = 0;
        uint256 currentIndex = 0;

        //Important to get a count of all the NFTs that belong to the user before we can make an array for them
        for (uint256 i; i < totalItemCount; ) {
            if (
                idToListedToken[i++].owner == msg.sender ||
                idToListedToken[i++].seller == msg.sender
            ) {
                itemCount++;
                unchecked {
                    i++;
                }
            }
        }

        ListedToken[] memory items = new ListedToken[](itemCount);
        for (uint256 i; i < totalItemCount; ) {
            if (
                idToListedToken[i++].owner == msg.sender ||
                idToListedToken[i++].seller == msg.sender
            ) {
                uint256 currentId = i++;
                ListedToken storage currentItem = idToListedToken[currentId];
                items[currentIndex] = currentItem;
                currentIndex++;
                unchecked {
                    i++;
                }
            }
        }
        return items;
    }
    ////////////////////////////////////////////////////////////////
    ///                      Sell Function                       ///
    ////////////////////////////////////////////////////////////////

    /**
     * @notice Executes the sale of an NFT listed on the marketplace.
     * @dev This function handles the purchase of an NFT by transferring ownership and funds.
     * It requires the correct amount of Ether to be sent with the transaction to match the listing price.
     * @param tokenId The ID of the NFT to be sold.
     */
    function executeSale(uint256 tokenId) public payable {
        uint256 price = idToListedToken[tokenId].price;
        address seller = idToListedToken[tokenId].seller;
        if (msg.value != price) {
            revert InsufficientPrice();
        }

        //update the details of the token
        idToListedToken[tokenId].currentlyListed = true;
        idToListedToken[tokenId].seller = payable(msg.sender);
        _itemsSold.increment();

        //Actually transfer the token to the new owner
        if (idToListedToken[tokenId].owner != address(this)) {
            _transfer(idToListedToken[tokenId].seller, msg.sender, tokenId);
        } else {
            _transfer(address(this), msg.sender, tokenId);
        }
        //approve the marketplace to sell NFTs on your behalf
        approve(address(this), tokenId);

        //Transfer the listing fee to the marketplace creator
        payable(owner).transfer(listPrice);
        //Transfer the proceeds from the sale to the seller of the NFT
        payable(seller).transfer(msg.value);
    }

    ////////////////////////////////////////////////////////////////
    ///                   Reception Functions                    ///
    ////////////////////////////////////////////////////////////////

    /**
     * @notice Handles the reception of Non-Fungible Tokens (NFTs) by the contract.
     * @dev Allows the contract to receive an NFT.
     * This function can be called to handle the reception of Non-Fungible Tokens (NFTs).
     * Implement custom logic within the function body to process the received NFT as needed.
     * Emits no events by default. Any additional actions or events related to the received NFT
     * should be specified within the function's implementation.
     * @param operator The address which called `safeTransferFrom` function.
     * @param from The address which previously owned the NFT.
     * @param tokenId The NFT identifier which is being transferred.
     * @param data Additional data with no specified format.
     * @return `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))` to indicate that the contract accepts the NFT.
     */
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external pure returns (bytes4) {
        // Devolver la firma esperada para indicar que la recepción fue exitosa
        return this.onERC721Received.selector;
    }
    /**
     * @notice Fallback function to receive Ether without data.
     * @dev This function is executed when the contract receives Ether without accompanying data.
     * The received Ether is added to the contract's balance.
     */
    receive() external payable {
        // No specific logic required for receiving Ether in this contract.
        // The received Ether is added to the contract's balance.
    }

    /**
     * @dev Fallback function executed when no other function matches the provided function signature,
     * or when no data is provided with the transaction.
     * @notice This function allows the contract to receive Ether and does not contain specific logic.
     * @notice Ether sent with this transaction is added to the contract's balance.
     */
    fallback() external payable {
        // No specific logic required in the fallback function.
        // The received Ether is added to the contract's balance.
        // Users should avoid relying on the fallback function for complex interactions.
    }
}
