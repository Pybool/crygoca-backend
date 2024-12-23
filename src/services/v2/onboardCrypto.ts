// Import the JSON file
import Cryptocurrencies from '../../models/cryptocurrencies.model';
import CryptoListing from '../../models/saleListing.model';
import jsonData from './cryptolist.json';
import { legacyCrypto } from './legacycrypto';

export const onBoardCryptos = async ()=>{
    const cryptodata:any = jsonData
    console.log("Data count ", cryptodata.data.length)
    for (let crypto of cryptodata["data"]){
        const payload = {
            cryptoId: crypto.id,
            name: crypto.name,
            logo: null,
            symbol: crypto.symbol,
            slug: crypto.slug,
            tags: crypto.tags.join(","),
            platform: crypto?.platform || null,
            crygocaSupported: false,
            dateAdded: crypto.date_added,
            createdAt: new Date()

        }
        await Cryptocurrencies.create(payload)
    }
    return {
        status: true,
        message: "Done importing cryptocurrencies",
        code: 200
    }
}


export const insertLogos = async ()=>{
    const cryptodata:any = legacyCrypto
    for (let crypto of cryptodata){
       const cryptocurrency =  await Cryptocurrencies.findOne({symbol: crypto.symbol})
       if(cryptocurrency){
        if(!cryptocurrency.logo){
            cryptocurrency.logo = crypto.img_url
        .replace("https://raw.githubusercontent.com/ErikThiart/cryptocurrency-icons/master","https://be.crygoca.co.uk");
        await cryptocurrency.save()
        }
        
       }else{
        const payload = {
            cryptoId: crypto?.id || null,
            name: crypto.name,
            logo: crypto.img_url.replace("https://raw.githubusercontent.com/ErikThiart/cryptocurrency-icons/master","https://be.crygoca.co.uk"),
            symbol: crypto?.symbol,
            slug: crypto?.slug,
            tags: crypto?.tags?.join(",") || "",
            platform: crypto?.platform || null,
            crygocaSupported: false,
            dateAdded: crypto?.date_added || new Date(),
            createdAt: new Date()

        }

        await Cryptocurrencies.create(payload)
       }
    }
    return {
        status: true,
        message: "Done Filling Logos",
        code: 200
    }
}

export const appendCryptoToListings = async ()=>{
    const listings = await CryptoListing.find({})

    for(let listing of listings){
        const _crypto = await Cryptocurrencies.findOne({symbol: listing.cryptoCode});
        if(_crypto){
            listing.cryptoCurrency = _crypto._id;
            await listing.save()
        }
    }

    return {
        status: true,
        message: "Done Filling Listings With crypto ID",
        code: 200
    }
}

