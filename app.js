const express=require('express')
const cors=require('cors')
const fs=require('fs')

const app=express()
app.use(cors({credentials: true}))
app.use(express.json())

const Downloader = require("nodejs-file-downloader");
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const mainDownload = (playListName, downURL, title, type) => {
  return new Promise(async (resolve, reject) => {
    let extension = "";
    if (type === "video") extension = ".mp4";
    else extension = ".mp3";
    console.log("downloading");
    const downloader = new Downloader({
      url: downURL, //If the file name already exists, a new file with the name 200MB1.zip is created.
      // directory: "./" + playListName, //This folder will be created, if it doesn't exist.
      directory: "/tmp",
      cloneFiles: false,
      onError: function (error) {
        //You can also hook into each failed attempt.
        console.log("Error from attempt ", error);
      },
      fileName: title + extension,
    });
    try {
      const { filePath, downloadStatus } = await downloader.download(); //Downloader.download() resolves with some useful properties.m

      resolve({ downloadStatus, filePath });
    } catch (error) {
      // IMPORTANT: Handle a possible error. An error is thrown in case of network errors, or status codes of 400 and above.
      // Note that if the maxAttempts is set to higher than 1, the error is thrown only if all attempts fail.
      // console.log("Download failed", error);
      reject(error);
    }
  });
};

const upload = async (filePath) => {
  const file = fs.readFileSync(filePath);
  const filename0 = /\/(.+\.mp3)$/.exec(filePath)[1];

  let serverData;
  try {
    const res = await fetch("https://api.gofile.io/getServer");
    serverData = await res.json();
    console.log(serverData);
  } catch (err) {
    console.log(err);
  }

  const { status, data } = serverData;

  const uploadUrl = `https://${data.server}.gofile.io/uploadFile`;

  const formData = new FormData();

  formData.append("file", file, filename0);
  formData.append("token", goFileToken);

  let fileId, fileName, pageLink;
  try {
    const res2 = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });
    const uploadedFileData = await res2.json();

    fileId = uploadedFileData.data.fileId;
    fileName = uploadedFileData.data.fileName;
    pageLink = uploadedFileData.data.downloadPage;

    console.log("uploadedFile Data: ", uploadedFileData);
  } catch (err) {
    console.log(err);
  }

  const goFileDownloadLink = `https://${"store"}.gofile.io/download/${fileId}/${encodeURIComponent(
    fileName
  )}`;

  return { goFileDownloadLink, fileId, fileName, pageLink };
};

app.post('/download',async(req,res)=>{
	const {url}=req.body
	console.log('url: ',url)
	try{
		const obj=await mainDownload('',url,'file','video')
		const data=await upload(obj.filePath)
		
			console.log('d: ',data)
		

	console.log('filepath: ',obj.filePath)

	res.json('ok')	
	}

	catch(err){
		console.log('err: ',err)
		res.status(401).json(err)
	}
	
})

const PORT=process.env.PORT||8080

app.listen(PORT,()=>{
	console.log('app is running at ',PORT)
})


