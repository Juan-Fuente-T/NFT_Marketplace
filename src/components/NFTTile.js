//import axie from "../tile.jpeg";
import {
    BrowserRouter as Router,
    Link,
} from "react-router-dom";
import { GetIpfsUrlFromPinata } from "../utils";

function NFTTile(data) {
    const newTo = {
        pathname: "/nftPage/" + data.data.tokenId
    }

    const IPFSUrl = GetIpfsUrlFromPinata(data.data.image);

    return (
        <Link to={newTo}>
            <div className="border-2 ml-5 mr-5 mt-5 mb-12 flex flex-col items-center rounded-lg w-48 md:w-72 shadow-2xl">
                <img src={IPFSUrl} alt="" className="w-72 h-80 rounded-lg object-cover" />
            </div>
            <div className="text-white w-full p-2 bg-gradient-to-t from-[#313170] to-transparent rounded-lg pt-5 -mt-10">
                <strong className="text-xl">{data.data.name}</strong>
                <p className="display-inline">
                    {data.data.description}
                </p>
            </div>

        </Link>
    )
    /*
    return (
        <Link to={newTo}>
            <div className="border-2 ml-5 mr-5 mt-5 mb-12 flex flex-col items-center rounded-lg w-48 md:w-72 shadow-2xl">
                <img draggable="false" loading="eager" className="tw-outline-none tw-aspect-auto tw-m-auto tw-h-auto tw-w-auto tw-max-w-full tw-max-h-full SolanaNFTMedia_center__JRity" src={IPFSUrl} style={{ backgroundColor: "transparent" }} />
            </div>
            <div className="text-white w-full p-2 bg-gradient-to-t from-[#313170] to-transparent rounded-lg pt-5 -mt-10">
                <strong className="text-xl">{data.data.name}</strong>
                <p className="display-inline">
                    {data.data.description}
                </p>
            </div>

        </Link>
    )*/

}

export default NFTTile;
