import { useEffect, useState } from "react";
import Delete from "./assets/image.png"
import axios from "axios"

function App() {
  
  const [value, setValue]=useState('');
  const [data, setData]=useState('');
  const [submitting, setSubmitting]=useState(false);
  const [isCopy, setIsCopy]=useState(false);
  const [selected, setSelected]=useState(null)

  const apiURL="http://localhost:8800"


  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);


    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      console.log("API key is missing");
      setSubmitting(false);
      return;
    }
  
    const apiKeys = import.meta.env.VITE_OPENAI_API_KEY;


    if (!apiKeys) {
      console.log("API key is missing");
      setSubmitting(false);
      return;
    }
  
    const requestOptions = {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKeys}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: `${value}\n\nTl;dr` }],
        temperature: 0.1,
        max_tokens: 50,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0.5,
      }),
    };
  
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', requestOptions);
      const dt = await response.json();
  
      if (response.ok && dt.choices && dt.choices.length > 0) {
        const text = dt.choices[0].message.content;
        localStorage.setItem("summary", JSON.stringify([...data, { id: new Date().getTime(), text }]));
        fetchLocalStorage();
      } else {
        console.error('Unexpected API response:', dt);
      }
    } catch (error) {
      console.error('Error:', error);
      if (error.message.includes('insufficient_quota')) {
        alert('Your API usage has exceeded the current quota. Please check your OpenAI account.');
      }
    } finally {
      setSubmitting(false);
    }
  };
  


  const handleSubmitPDF = async (e) => {
    e.preventDefault();
    setSubmitting(true);
  
    const file = e.target.files[0];
    if (!file) {
      console.error("No file selected.");
      setSubmitting(false);
      return;
    }
  
    const formData = new FormData();
    formData.append("filename", "User File");
    formData.append("uploadedFile", file);
  
    try {
      const { data: res } = await axios.post(apiURL + "/summary", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      localStorage.setItem("summary", JSON.stringify([...data, res]));
      fetchLocalStorage();
    } catch (error) {
      console.error("Error uploading file:", error.response?.data || error.message);
    } finally {
      setSubmitting(false);
    }
  };
  

  const fetchLocalStorage = async () => {
    const result = localStorage.getItem("summary");
    setData(JSON.parse(result));
  };

  async function copyTextToClipboard(text) {
    if ("clipboard" in navigator) {
      return await navigator.clipboard.writeText(text);
    }
  }

  const handleCopy = (txt) => {
    copyTextToClipboard(txt.text).then(() => {
      setSelected(txt.id);
      setIsCopy(true);
      setTimeout(() => {
        setIsCopy(false);
        setSelected(null);
      }, 1500);
    }).catch((err) => console.log(err));
  };

  const handleDelete = (txt) => {
    const filtered = data?.filter((d) => d.id !== txt.id);
    setData(filtered);
    localStorage.setItem("summary", JSON.stringify(filtered));
  };

  useEffect(() => {
    fetchLocalStorage();
  }, []);

  return (
    
    <div className="w-full bg-[#0f172a] h-full min-h-[100vh]
      py-4
      px-4
      md:px-20">
      
      <div className="w-full">
        <div 
        className="flex flex-row justify-between items-center w-full h-10 px-5 2xl:px-40">
        <h1 className="text-3xl font-bold  text-cyan-600 cursor-pointer">
          Summary!
        </h1>
        </div>
        <div className="flex flex-col items-center justify-center mt-4 p-4">
          <h1 className="text-3xl text-white text-center leading-10 font-semibold">Text Summarizer using 
          <span className="text-5xl font-bold text-cyan-500"> OpenAI GPT</span>
          </h1>
          <p className="mt-5 text-lg text-gray-500 sm:text-xl text-center max-w-2xl">Upload your Document and get a Text summary using gpt summarizer.</p>
        </div>
        <div className="flex flex-col w-full items-center justify-center mt-5">
          <textarea placeholder="give your document content here..." rows={6} 
          className="block w-full md:w-[650] rounded-md border border-slate-700 bg-slate-800
          p-2 text-sm shadow-lg font-medium text-white focus:border-gray-500
          focus:outline-none focus:ring-0" onChange={(e)=>setValue(e.target.value)}></textarea>
          {value.length > 0 && (submitting ? (<p className="text-xl text-cyan-500 mt-5">Loading Please Wait...</p>) : 
          (<button
           className="mt-5 bg-blue-700 px-5 py-2 text-white text-2xl font-semibold cursor-pointer rounded-lg
          hover:bg-blue-400" onClick={handleSubmit}>Submit</button>))}
          {!value?.length >0 && (<div className="mt-5">
            <label htmlFor="userFile" className="text-white mr-2">Choose file</label>
            <input type="file" id="userFile" name="userFile" accept=".pdf" className="text-slate-300" 
              onChange={(e)=>handleSubmitPDF(e)}
            />
          </div>)}
          {submitting && (<p className="text-xl text-cyan-500 mt-5">Loading Please Wait...</p>)}

        </div>
    </div>
    <div className="w-full mt-10 flex flex-col gap-5 shadow-md items-center justify-center">
    {data?.length > 0 && (
    <>
    <p className="text-white font-semibold text-lg">Summary History</p>
    
    {data?.map((d,index)=>(
      <div className="max-w-2xl bg-slate-800 p-3 rounded-md" key={index}>
        <p className="text-gray-400 text-lg">{d.text}</p>
        <div className="flex gap-5 items-center justify-end mt-2">
          <p className="text-gray-500 font-semibold cursor-pointer" onClick={()=>handleCopy(d)}>{isCopy && selected === d.id?"Copied":"Copy"}</p>
          <span className="cursor-pointer" onClick={()=>handleDelete(d)}>
            <img src={Delete} className="w-6 h-6"/>
          </span>
        </div>
      </div>
    ))}
    </> 
    )}
    </div>
  </div>
  );
}

export default App
