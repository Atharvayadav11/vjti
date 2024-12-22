import express, { response } from "express"
import { createServer } from "http"
import { Server } from "socket.io"
import { AImodel } from "./controllers/geminiAi.js"
import cors from "cors"
import bodyParser from "body-parser"
import { Client, Databases } from "appwrite";
import dotenv from "dotenv"

dotenv.config()

const app = express()
const httpserver = createServer(app)

const client = new Client();

client
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT)


const fetchAllDocuments = async (databaseId, collectionId) => {
    const databases = new Databases(client);

    try {
        const documents = await databases.listDocuments(databaseId, collectionId);
        console.log("Documents fetched successfully:", documents.documents);
        return documents.documents;
    } catch (error) {
        console.error("Error fetching documents:", error);
        throw error;
    }
};

const allTransaction = await fetchAllDocuments(process.env.APPWRITE_DATABASE_ID, process.env.APPWRITE_TRANSACTION_COLLECTION_ID)
console.log(allTransaction)

const users = [
    {
        username: "Yuvraj",
        receiverId: '67674c10000e361f28ac',
        receiverBankId: '67674c53002637c86f5e'
    }
]

function searchbyKeyword(keyword) {
    console.log(all_products)
    const search_list = all_products.products
    const search_result = []
    for (let i = 0; i < search_list.length; i++) {
        // Check if the product name contains the keyword (case-insensitive)
        if (search_list[i].name.toLowerCase().includes(keyword.toLowerCase())) {
            search_result.push(search_list[i]);
        }
    }

    console.log(search_result)
    return search_result

}

const io = new Server(httpserver, {
    cors: {
        origin: "http://localhost:3001"
    }
})

io.use((socket, next) => {
    const user_name = socket.handshake.auth.user_name;
    console.log(user_name)
    socket.user_name = user_name
    next()
});


io.on('connection', (socket) => {
    console.log(socket.id, socket.user_name)

    const actual_history = [{
        role: "user",
        parts: [
            {
                text: `You are Mark, a personal financial assistant, here to assist with bank transactions, balances, financial advice, and related activities. When the user explicitly asks to navigate to a page, respond with "open LOCATION NAME," where LOCATION NAME is the closest matching page name from the following: home, transactions, myBanks, transferfunds, or connectBanks (excluding the word "page"). For instance, if the user says "navigate to the transactions page," respond with "open transactions."

All transaction details are passed to you, so provide users with accurate and relevant information based on the data provided. For balance inquiries or transaction history, respond clearly and helpfully. If the user asks about their previous transactions, provide only the first 5 transaction details initially. Then ask if they would like to see more. If they confirm, provide additional transaction details in batches.

For fund transfers, ask the user for the username of the recipient and the amount (in dollars) before proceeding. If the user wants to transfer funds to another user, emit the recipient's details in the following JSON format, using the user list provided to you:
{
  "type": "transaction",
  "username": "",
  "amount": "",
  "receiverId": "",
  "receiverBankId": ""
}
In addition to transactional assistance, you will provide financial advice as per Indian laws and guidelines. This includes advice on saving, budgeting, taxation, and investments, based on the user’s queries and financial situation.

Respond naturally and professionally, avoiding unnecessary formatting, emojis, or extra characters. Always maintain a straightforward, user-friendly, and legally compliant tone respond in paragraph format and dont give teh response in .md format.Respond concisely.
                `},
        ],
    },
    {
        role: "user",
        parts: [
            { text: JSON.stringify(allTransaction) },
        ],
    },
    {
        role: "user",
        parts: [
            { text: JSON.stringify(users) },
        ],
    },
    // {
    //     role: "user",
    //     parts: [
    //         { text: JSON.stringify(cart) },
    //     ],
    // },
    // {
    //     role: "user",
    //     parts: [
    //         { text: JSON.stringify(wishlist) },
    //     ],
    // },
    {
        role: "model",
        parts: [
            { text: "Hello, I am your personal shopping assistant. How may I assist you?" },
        ],
    },]
    const chatSession = AImodel.startChat({

        // safetySettings: Adjust safety settings
        // See https://ai.google.dev/gemini-api/docs/safety-settings
        history: actual_history
    });

    socket.on('prompt', async (response) => {
        console.log(response)

        actual_history.push({
            role: "user",
            parts: [
                { text: `${response}` }
            ]
        })

        try {
            const result = await chatSession.sendMessage(response);
            const Airesponse = result.response.text();

            if (Airesponse) {
                actual_history.push({
                    role: "model",
                    parts: [
                        { text: `${Airesponse}` }
                    ]
                })
            }
            socket.emit("response", Airesponse)

        }
        catch (err) {
            socket.emit("error", "some internal error occured")
            console.error(err)
        }

    })
})

app.use(cors())
app.use(bodyParser.json())
app.get("/all_products", (req, res) => {
    res.status(200).send(all_products)
})

app.get("/profile", (req, res) => {
    res.status(200).send(profile)
})

app.get("/cart", (req, res) => {
    res.status(200).send(cart)
})

app.get("/wishlist", (req, res) => {
    res.status(200).send(wishlist)
})

app.post("/add_to_cart", (req, res) => {
    const keyword = req.body.product_name
    console.log(keyword)
    const str_keyword = String(keyword)
    const search_list = all_products.products

    let search_result
    for (let i = 0; i < search_list.length; i++) {
        console.log("product ", search_list[i])
        // Check if the product name contains the keyword (case-insensitive)

        if (search_list[i].name.toLowerCase() == str_keyword.toLowerCase()) {
            search_result = search_list[i];
            break
        }
    }
    console.log("search result", search_result)
    const isInCart = cart.cart_products.some(product => product.id === search_result.id);

    if (!isInCart) {
        // Add the product to the cart if it is not already present
        cart.cart_products.push(search_result);
        res.status(200).send(`${search_result.name} added successfully to cart`);
    } else {
        // Send a response indicating that the product is already in the cart
        res.status(200).send(`${search_result.name} is already present in cart`);
    }

})

app.post("/add_to_wishlist", (req, res) => {
    const keyword = req.body.product_name
    console.log(keyword)
    const str_keyword = String(keyword)
    const search_list = all_products.products

    let search_result
    for (let i = 0; i < search_list.length; i++) {
        console.log("product ", search_list[i])
        // Check if the product name contains the keyword (case-insensitive)

        if (search_list[i].name.toLowerCase() == str_keyword.toLowerCase()) {
            search_result = search_list[i];
            break
        }
    }
    console.log("search result", search_result)
    const isInwishlist = wishlist.wishlist_products.some(product => product.id === search_result.id);

    if (!isInwishlist) {
        // Add the product to the cart if it is not already present
        wishlist.wishlist_products.push(search_result);
        res.status(200).send(`${search_result.name} added successfully to wishlist`);
    } else {
        // Send a response indicating that the product is already in the cart
        res.status(200).send(`${search_result.name} is already present in wishlist`);
    }

})

httpserver.listen(3000, () => {
    console.log("server is running on port 3000")
})

export { io }
