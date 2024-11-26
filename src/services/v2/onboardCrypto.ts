// Import the JSON file
import Cryptocurrencies from '../../models/cryptocurrencies.model';
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
        cryptocurrency.logo = crypto.icon_url;
        await cryptocurrency.save()
       }
    }
    return {
        status: true,
        message: "Done Filling Logos",
        code: 200
    }
}

