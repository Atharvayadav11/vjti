"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import axios from "axios";
import { socket } from "../lib/socket";
import { speakText } from "../lib/speech";
import "./styles/chatbot.css";
import { createTransaction } from "@/lib/actions/transaction.actions";

export default function Chatbot({ setUserLogin }: any) {
  const router = useRouter();
  const pathname = usePathname();
  const [transcript, setTranscript] = useState("");
  const [chatVisibility, setChatVisibility] = useState(false);
  const [chatContent, setChatContent] = useState(
    "Hello, I am Mark, your personal financial assistant. How can i assist you today?"
  );

  const recognitionRef = useRef<any>(null);
  const accumulatedTranscriptRef = useRef("");
  const chatStatusRef = useRef(false);
  const loopRef = useRef(false);

  // Initialize chatStatus from localStorage
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const chatStatus = localStorage.getItem("chatActive");
        chatStatusRef.current = chatStatus === "true";
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error);
    }
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      try {
        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            console.log(result);
            if (result.isFinal) {
              finalTranscript += result[0].transcript;
              setTimeout(() => {
                recognitionRef.current?.stop();
              }, 2500);
            } else {
              interimTranscript += result[0].transcript;
            }
          }

          accumulatedTranscriptRef.current += finalTranscript;
          setTranscript(accumulatedTranscriptRef.current + interimTranscript);
        };

        recognition.onend = () => {
          if (accumulatedTranscriptRef.current) {
            setChatContent(accumulatedTranscriptRef.current);
            accumulatedTranscriptRef.current =
              accumulatedTranscriptRef.current + `page name : ${pathname}`;
            socket.emit("prompt", accumulatedTranscriptRef.current);
          }
          accumulatedTranscriptRef.current = "";
          setTranscript("");
          if (loopRef.current) {
            startRecognition();
          }
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
        };

        recognitionRef.current = recognition;
      } catch (error) {
        console.error("Error initializing speech recognition:", error);
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error("Error stopping recognition:", error);
        }
      }
    };
  }, []);

  const startChat = () => {
    try {
      socket.connect();
      const textToSpeak =
        "Hello, I am Mark, your personal Financial assistant. How can i assist you today?";

      if (pathname === "/" && chatStatusRef.current) {
        speakText(textToSpeak);
      }

      startRecognition();
    } catch (error) {
      console.error("Error starting chat:", error);
    }
  };

  const startRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error("Recognition start error:", error);
      }
    }
  };

  const handleAPIRequest = async (endpoint: string, productName: string) => {
    try {
      const last_index = productName.indexOf("\\");
      const new_product_name =
        last_index > -1
          ? String(productName.slice(0, last_index).trim())
          : String(productName.trim());

      const { data } = await axios.post(`/api/${endpoint}`, {
        product_name: new_product_name,
      });
      speakText(data);
      setChatContent(data);
      return data;
    } catch (error) {
      console.error(`Error in ${endpoint}:`, error);
      const errorMessage = "Sorry, there was an error processing your request.";
      speakText(errorMessage);
      setChatContent(errorMessage);
    }
  };

  const add_to_cart = (productName: string) =>
    handleAPIRequest("add_to_cart", productName);
  const add_to_wishlist = (productName: string) =>
    handleAPIRequest("add_to_wishlist", productName);

  useEffect(() => {
    const handleResponse = async (response: string) => {
      try {
        const first_index = response.indexOf("{");
        const last_index = response.lastIndexOf("}");

        if (first_index > -1 && last_index > -1) {
          const json_extract = response.slice(first_index, last_index + 1);
          const response_json = JSON.parse(json_extract);
          console.log(response_json);
          if (response_json.type == "transaction") {
            console.log(response_json);
            const { amount, receiverId, receiverBankId } = response_json;
            const data = await createTransaction({
              name: "transaction",
              amount,
              senderId: "676746b8002f970d9da8",
              senderBankId: "676746f900174846698b",
              receiverId,
              receiverBankId,
              email: "123@gmail.com",
            });
            console.log(data);
            return;
          }
          localStorage.setItem("search_result", JSON.stringify(response_json));
          // router.push("/searchresult");z
          speakText(response_json.summary);
          setChatContent(response_json.summary);
          return;
        }

        const parts = response.split(" ");
        const command = parts[0].toLowerCase();

        switch (command) {
          case "cart":
            add_to_cart(response.slice(5));
            break;
          case "wishlist":
            add_to_wishlist(response.slice(9));
            break;
          case "open":
            handleNavigation(parts.slice(1).join(" "));
            break;
          default:
            setChatContent(response);
            speakText(response);
            break;
        }
        startRecognition();
      } catch (error) {
        console.error("Error handling response:", error);
      }
    };

    socket.on("response", handleResponse);
    return () => {
      socket.off("response", handleResponse);
    };
  }, [router]);

  const handleNavigation = (pageName: string) => {
    console.log("pageName", pageName);
    const pageRoutes: Record<string, string> = {
      home: "/", // Home page
      homepage: "/", // Homepage page (same route as home)
      transactions: "/transaction-history", // Transaction History page
      transactionspage: "/transaction-history", // Transaction History page (same route)
      mybanks: "/my-banks", // My Banks page
      mybankspage: "/my-banks", // My Banks page (same route)
      transferfunds: "/payment-transfer", // Payment Transfer page
      transferfundspage: "/payment-transfer", // Payment Transfer page (same route)
    };

    const normalizedPage = pageName.replace(/\s+/g, "").toLowerCase();
    if (pageRoutes[normalizedPage]) {
      speakText(`opening ${normalizedPage}`);
      router.push(pageRoutes[normalizedPage]);
    } else {
      speakText("Invalid page name");
    }
  };

  return (
    <>
      <button
        className="button AIbutton"
        id="AIbutton"
        onClick={() => {
          if (!loopRef.current) {
            startChat();
            localStorage.setItem("chatActive", "true");
            setChatVisibility(true);
          } else {
            localStorage.setItem("chatActive", "false");
          }
          loopRef.current = !loopRef.current;
        }}
      >
        <video width="150" height="150" autoPlay loop muted>
          <source src="/AiAnimation.webm" type="video/webm" />
        </video>
      </button>
      {chatVisibility && (
        <div className="output-div" id="output-div">
          <button
            className="close_btn"
            onClick={() => setChatVisibility(false)}
            aria-label="Close chat"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24"
              viewBox="0 -960 960 960"
              width="24"
              fill="#5f6368"
            >
              <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
            </svg>
          </button>
          <p>{chatContent}</p>
        </div>
      )}
    </>
  );
}
