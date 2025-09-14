
// Base url For sandbox  
// const PHYLLO_BASE_URL = "https://api.sandbox.getphyllo.com";

// Base url for staging
const PHYLLO_BASE_URL = "https://api.staging.getphyllo.com";

const URL_CREATE_SDK_TOKEN = "/v1/sdk-tokens";
const URL_CREATE_USER = "/v1/users";

// SANDBOX CREDENTIALS
// const PHYLLO_CLIENT_ID = "170573dd-0ca1-407f-bd37-bf8464ef030d";
// const PHYLLO_SECRET_ID = "c73a5e1e-7b97-4b02-b950-8c75a54b2bb0";

// STAGING CREDENTIALS
const PHYLLO_CLIENT_ID = "5395ed36-d269-460a-bb2a-6a0ee2857889";
const PHYLLO_SECRET_ID = "cd8ef27d-fd52-4cf0-ab2d-f289cf01cf27";

// encode client_id:secret to base-64
const AUTH_KEY = window.btoa(PHYLLO_CLIENT_ID+":"+PHYLLO_SECRET_ID);

const getAxiosInstance = () => {
  const api = axios.create({
    baseURL: PHYLLO_BASE_URL,
    headers: {
      'Authorization':'Basic ' + AUTH_KEY
    },
  });
  return api;
};



const phylloSDKConnect = async (workPlatformId = null) => {
  try {
    const sandboxEnv = "sandbox"; // the mode in which you want to use the SDK,  'sandbox' or 'production'
    const stagingEnv = "staging";
    let appName = "Service Worker App";
    let name = "Mansir Hussaini";
    let externalId = "Mansir-1756979148637"; // Unique ID for the user supplied by you.

    let user_id = await fetchAllUserData();
    let token = await createSDKToken(user_id);

    const config = {
      environment: stagingEnv,
      userId:user_id,
      token: token,
      clientDisplayName: appName,
      workPlatformId:workPlatformId
    };

    const phylloConnect = window.PhylloConnect.initialize(config);

    // callbacks
    phylloConnect.on(
      "accountConnected",
      (accountId, workplatformId, userId) => {
        // gives the successfully connected account ID and work platform ID for the given user ID
        console.log(`onAccountConnected: Account id: ${accountId}, platformid: ${workplatformId}, userid: ${userId}`);
        localStorage.setItem("ACCOUNT_ID",accountId);
        localStorage.setItem("PLATFORM_ID",workPlatformId);
        localStorage.setItem("USER_ID",userId);
      }
    );

    phylloConnect.on(
      "accountDisconnected",
      (accountId, workplatformId, userId) => {
        // gives the successfully disconnected account ID and work platform ID for the given user ID
        console.log(
          `onAccountDisconnected: ${accountId}, ${workplatformId}, ${userId}`
        );
      }
    );
    phylloConnect.on("tokenExpired", (userId) => {
      // gives the user ID for which the token has expired
      console.log(`onTokenExpired: ${userId}`); // the SDK closes automatically in case the token has expired, and you need to handle this by showing an appropriate UI and messaging to the users
    });
    phylloConnect.on("exit", (reason, userId) => {
      // indicates that the user with given user ID has closed the SDK and gives an appropriate reason for it
      console.log(`onExit: ${reason}, ${userId}`);
    });
    phylloConnect.on(
      "connectionFailure",
      (reason, workplatformId, userId) => {
        // optional, indicates that the user with given user ID has attempted connecting to the work platform but resulted in a failure and gives an appropriate reason for it
        console.log(`onConnectionFailure: ${reason}, ${workplatformId}, ${userId}`);
      }
    );

    phylloConnect.open();
  } catch (err) {
    console.log(err);
  }
};




const createUser = async (username, externalId) => {
  try {
    const userId = localStorage.getItem("USER_ID");
    
    if ( userId !== undefined) {
      return userId;   
    }
    
    if(userId === undefined || userId === null) {
      const api = getAxiosInstance();
      let response = await api.post(URL_CREATE_USER, {
        name: username,
        external_id: externalId,
      });

      if(response.data.error && response.data.error.message ===  "User already exist with external id"){
        const api = getAxiosInstance();
        let response = await api.post(`${URL_CREATE_USER}?limit=${1}&offset=${1}`);
        let USER_ID = response.data.data[0].id;
        localStorage.setItem("USER_ID", USER_ID);
        return response.data.data[0].id;
      }
      let USER_ID = response.data.data[0].id;
      localStorage.setItem("USER_ID", USER_ID)
      return USER_ID;
    }
  } catch (err) {
    console.error(`Error ${err} occurred while creating user`);
    return err.body;
  }
};

const fetchAllUserData = async ()=>{
  const api = getAxiosInstance();
  const response = await api.get(URL_CREATE_USER);
  localStorage.setItem("USER_ID", response.data.data[0].id);
  return response.data.data[0].id;
};

 function login(){
  fetch("http://localhost:4000/create-user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Mansir Hussaini",
      external_id: "Mansir-1756979148637"
    })
  })
  .then(res => res.json())
  .then(data => {
    console.log("✅ Created user:", data); 
  })
  .catch(err => console.error("Error:", err));
}


const createSDKToken = async (userId) => {
  if (!userId) {
    let err = new Error("User id cannot be blank or null");
    throw err;
  }
  try {
    const api = getAxiosInstance();
    let response = await api.post(URL_CREATE_SDK_TOKEN, {
      user_id: userId,
      products: ["IDENTITY", "ENGAGEMENT","ENGAGEMENT.AUDIENCE","INCOME"],
    });
    return response.data.sdk_token;
  } catch (err) {
    console.error(`Error ${err} occurred while generating user token`);
    return err.body;
  }
};


class ServiceWorkerApp{
  constructor(){
      let CACHED_USER_ID = localStorage.getItem("USER_ID");
      let CACHED_ACCOUNT_ID = localStorage.getItem("ACCOUNT_ID");
      this.userId = CACHED_USER_ID;

      if(CACHED_ACCOUNT_ID==undefined || CACHED_ACCOUNT_ID == null){
        this.accountId = undefined; 
      }else{
        this.accountId = localStorage.getItem("ACCOUNT_ID");
      }

      this.totalViews = document.querySelector(".views-number-placeholder");
      this.yearsListHolder = document.querySelector(".years-list");
      this.years = document.querySelector(".years");
      this.monthListHolder = document.querySelector(".years-month-list");
  }
  
  monthMapping(){
      let months = {
          "01":"Jan",
          "02":"Feb",
          "03":"Mar",
          "04":"Apr",
          "05":"May",
          "06":"Jun",
          "07":"Jul",
          "08":"Aug",
          "09":"Sep",
          "10":"Oct",
          "11":"Nov",
          "12":"Dec"
      }
      return months;
  }

  async yearMapping(){
    let viewsData = await this.userDataFetch();
    let yearlyViewsHolder = [];

    for(let i of viewsData){
      let monthViewMapping = Object.values(i);
      yearlyViewsHolder.push(monthViewMapping);
    }


    this.yearsListHolder.innerHTML = ``;
    viewsData.reverse().forEach((element) => {
      let years = Object.keys(element);
      this.yearsListHolder.innerHTML += `<div class="years" status = 1>${years}</div>`;
    });

    
    let monthNamesObject = this.monthMapping();
    let monthNames = [];
    let monthViews = [];

    for(let i of yearlyViewsHolder){
      let months = Object.keys(i[0]);
      let views = Object.values(i[0]);
      monthViews.push(views);
      monthNames.push(months.map(m => monthNamesObject[m]));
    }

    let eachYearPicker = document.querySelectorAll(".years");

    for(let k=0; k<eachYearPicker.length; k++){
      eachYearPicker[k].addEventListener('click',function(){
        for(let l = 0; l<eachYearPicker.length; l++){
          eachYearPicker[l].classList.remove("year-active");
        }

        eachYearPicker[k].classList.add("year-active");
        
      },false);
    }

    let monthListHolder = this.monthListHolder;

    eachYearPicker.forEach(function(k,v){
      window.addEventListener('DOMContentLoaded',function(){
        [viewsData[v]].forEach(function(k){
          let months = Object.values(k);
          let mappedMonthKeys = Object.keys(months[0]);
          let mappedMonthViews = Object.values(months[0]);
        
          let mappedMonths = mappedMonthKeys.map(m => monthNamesObject[m]);
          let dataPacker = [mappedMonths,mappedMonthViews];

          monthListHolder.innerHTML = ``;

          for(let i = 0; i<dataPacker[0].length; i++){
            monthListHolder.innerHTML +=  `<div class="months">
                                            <div class="month">${dataPacker[0][i]}</div> 
                                            <div class="views-per-month">Views ${dataPacker[1][i]}</div>
                                           </div>`;
           
          }

        });
      },false);

      eachYearPicker[v].addEventListener('click',function(){
        [viewsData[v]].forEach(function(k){
          let months = Object.values(k);
          let mappedMonthKeys = Object.keys(months[0]);
          let mappedMonthViews = Object.values(months[0]);
        
          let mappedMonths = mappedMonthKeys.map(m => monthNamesObject[m]);
          let dataPacker = [mappedMonths,mappedMonthViews];
          monthListHolder.innerHTML = ``;
          
          for(let i = 0; i<dataPacker[0].length; i++){
            monthListHolder.innerHTML +=  `<div class="months">
                                            <div class="month">${dataPacker[0][i]}</div> 
                                            <div class="views-per-month">Views ${dataPacker[1][i]}</div>
                                           </div>`;
           
          }

        });
        
      },false);
    });
    
    
  }

  async userDataFetch(){
    // let data = await this.retrieveAllContent();
      let data = [
      { view_count:50, published_at:"2025-05-31" },
      { view_count:40, published_at:"2025-05-31" },
      { view_count:13, published_at:"2025-05-31" },
      { view_count:70, published_at:"2025-06-31" },
      { view_count:40, published_at:"2025-06-31" },
      { view_count:100, published_at:"2025-07-31" },
      { view_count:300, published_at:"2025-08-31" },
      { view_count:70, published_at:"2024-01-31" },
      { view_count:62, published_at:"2024-02-31" },
      { view_count:83, published_at:"2024-03-31" },
      { view_count:91, published_at:"2024-04-31" },
      { view_count:90, published_at:"2024-06-31" },
      { view_count:105, published_at:"2024-07-31" },
      { view_count:200, published_at:"2024-08-31" }
    ];
    let grouped = {};
    
    for (let item of data) {
      let [year, month] = item.published_at.split("-");
    
      if (!grouped[year]) grouped[year] = {};
      if (!grouped[year][month]) grouped[year][month] = 0;
    
      grouped[year][month] += item.view_count;
    }

    let finalResult = Object.entries(grouped).map(([year, months]) => {
      return { [year]: months };
    });
    
    return await finalResult;
    
  }

  async createUserChart(){
    const ctx = document.getElementById("areaChart").getContext("2d");
     
    let result = await this.userDataFetch();
    let monthsCombined;
    let viewsCombined;

    for(let k of result){
      monthsCombined = Object.keys(k);
      viewsCombined = Object.values(k);
    }
    

    let monthNamesObject = this.monthMapping();
    let viewsMonth = Object.keys(viewsCombined[0]);
    let viewsCount = Object.values(viewsCombined[0]);
    let monthNames = viewsMonth.map(m => monthNamesObject[m]);

    let totalViews = 0 ;
    for (let g of viewsCount){
        totalViews += g; 
    }

    this.totalViews.textContent = totalViews;
    
    let chart = {
                  type: "line",   // area graph is just a line chart with fill
                  data: {
                    labels: monthNames,
                    datasets: [{
                      label: "Views",
                      data: viewsCount,
                      fill: true,               // enables "area" shading
                      backgroundColor: "rgba(75,192,192,0.2)", // fill color
                      borderColor: "rgba(75,192,192,1)",       // line color
                      tension: 0.4              // makes the line smooth
                    }]
                  },
                  options: {
                    responsive: true,
                    plugins: {
                      title: {
                        display: false,
                        text: "Monthly Sales (Area Chart)"
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    }
                  }
                };

    const areaChart = new Chart(ctx,chart);
  }

  async retrieveAllAccount(){
    let URL_RETRIEVE_ALL_ACCOUNT = `${PHYLLO_BASE_URL}/v1/accounts?user_id=${this.userId}`;
    const api = getAxiosInstance();
    const response = await api.get(URL_RETRIEVE_ALL_ACCOUNT);
    let ACCOUNT_ID = response.data.data[0].id;
    localStorage.setItem("ACCOUNT_ID",ACCOUNT_ID);
    // console.log("ACCOUNT ID",ACCOUNT_ID);
    return ACCOUNT_ID; 
  }

  async retrieveAllProfile(){
    try{
      let breaker = this.accountId.split('"');
      let id = breaker[1];
      if(this.accountId !== undefined && this.userId !== undefined){
        let URL_RETRIEVE_ALL_PROFILE = `${PHYLLO_BASE_URL}/v1/profiles?account_id=${id}&user_id=${this.userId}`;
        const api = getAxiosInstance();
        const response = await api.get(URL_RETRIEVE_ALL_PROFILE);
        let PROFILE_ID = JSON.stringify(response.data.data[0].id);
        localStorage.setItem("PROFILE_ID",PROFILE_ID);
        // console.log("PROFILE_ID",PROFILE_ID);
        return PROFILE_ID; 
      }else{
        console.log("Profile Properties are undefined")
      }
      
    }
    catch(e){
      console.log(e);
    }
      
  }


  async retrieveAllContent(){
    try{

      let ACCOUNT_ID = this.accountId;
      
      if(this.accountId !== undefined){
        let URL_RETRIEVE_ALL_CONTENT = `${PHYLLO_BASE_URL}/v1/social/contents?account_id=${ACCOUNT_ID}`;
        const api = getAxiosInstance();
        const response = await api.get(URL_RETRIEVE_ALL_CONTENT).then(res=>{return res});
        let compiledData = [];
        let allData = response.data.data;

        allData.forEach((k,l)=>{
          compiledData.push({
            view_count:k.engagement.view_count,
            published_at:k.published_at
          });
        });

        return compiledData;

      }else{
        console.log("Content Properties are undefined");
        return "ACCOUNT_ID is undefined";
      }
      
    }catch(e){
      console.error(e);
    }
     
  }

}


let workerData = new ServiceWorkerApp();
    workerData.createUserChart();
    workerData.retrieveAllAccount();
    // workerData.retrieveAllProfile();
    // workerData.retrieveAllContent();
    workerData.monthMapping();
    workerData.yearMapping();


class YearSelector{
  constructor(){
    this.year = document.querySelectorAll(".years");
  }

  pickYear(){
    for (let i = 0; i <= this.year.length; i++) {
      console.log(this.year[i]);
      this.year[i].addEventListener('click',function(){
        let eachBtn = document.querySelectorAll(".years");
        eachBtn[i].style.color = "rgb(85, 154, 243)";
        eachBtn[i].style.borderBottom = "rgb(85, 154, 243) 2px solid";
      }); 


    }
  
  }
}

let instance = new YearSelector();
// instance.pickYear();


