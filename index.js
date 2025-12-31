function el(tag, atributs={}, ...children){
    const elemento = document.createElement(tag);
    for (const key in atributs) {
        if (key === 'style' && typeof atributs[key] === 'object') {
            Object.assign(elemento.style, atributs[key]);
            continue;
        }
        if (key in elemento) elemento[key] = atributs[key];
        else elemento.setAttribute(key, atributs[key]);
    }
    children.forEach(child => elemento.append(child));

    return elemento;

}
function fecharModal() {
    containerAdd.classList.remove("active");
    containerAdd.textContent = "";
}

const containerAdd = document.querySelector(".containerAddApps");
const containerApps = document.querySelector(".containerApps");


function eUmLinkValido(text){
    const padrao = /^(https?:\/\/)?([\w\d-]+\.)+\w{2,}(\/.*)?$/;
    return padrao.test(text);
    
}



function extrairNomeLimpo(url) {

    let nome = url.replace(/^https?:\/\//, "").replace("www.", "");
    nome = nome.split('.')[0];
    return nome.charAt(0).toUpperCase() + nome.slice(1);
}


let modoRemocao = false;

function alternarAvisoRemocao(mostrar) {
    const container = document.querySelector(".containerApps");
    const btns = document.querySelector("#btns");
    const avisoId = "aviso-remocao";
    let aviso = document.getElementById(avisoId);

    if (mostrar) {
        if (!aviso) {
            aviso = el("div", { 
                id: avisoId, 
                style: { 
                        background: "#ff4444", color: "white", padding: "10px", textAlign: "center", borderRadius: "5px", marginBottom: "10px" } 
            }, "Select a website  to remove");
            btns.append(aviso); 
        }
    } else if (aviso) {
        aviso.remove();
    }
}


function removeApp(urlParaRemover) {
    let links = JSON.parse(localStorage.getItem("mylinks")) || [];
    links = links.filter(site => site.url !== urlParaRemover);
    localStorage.setItem("mylinks", JSON.stringify(links));
    renderizaApps();
}


        

function mostrarModalConfirmacao(url) {
    containerAdd.textContent = "";
    containerAdd.classList.add("active");
    const cardConfirmacao = el("div", { class: "card",style:{padding: "20px",
            borderRadius: "8px",    
            boxShadow: "0 2px 5px rgba(0,0,0,0.2)"}
            }, 
        
            el("p", {style: { color: "gray"}}, `Are you sure you want do remove ${url}?`),
            el("button", { 
                style: {
                    cursor:"pointer",
                    border: "none",
                     background: "#e75c5c",
                     borderRadius: "8px", 
                     color: "white",
                    padding: "12px" },
                onclick: () => {
                    removeApp(url);
                    fecharModal();
                    desativarModoRemocao();
                }
            }, "yes, remove"),
            el("button", {style:{
                cursor:"pointer",
                border: "none",
                     background: "#808080ff",
                     borderRadius: "8px", 
                     color: "white",
                    padding: "12px",
                    margin:"12px"        
                }, 
                onclick:fecharModal
            }, "Cancel")
        
    );
    containerAdd.append(cardConfirmacao);
}



function salvaAppLocal(newlink){
    const links = JSON.parse(localStorage.getItem("mylinks")) || [];
    links.push(newlink)
    localStorage.setItem("mylinks", JSON.stringify(links));
}

function renderizaApps(){
    const container = document.querySelector(".containerApps");
    const sites = JSON.parse(localStorage.getItem("mylinks")) || [];
    container.textContent=""

    if(sites.length===0){
        container.append(el("p",{style: { color: "gray"}},"You dont have any apps yet please add them and enjoy :)"));
        return    
    }
    sites.forEach(site => {
     const card = el("div", { class: "app-card" },
                                el("a", { href: `https://${site.url}`, target: "_blank" },
                                el("img", { src: site.logo }),
                                el("p", {}, extrairNomeLimpo(site.url))
                                )
                            );
            

            card.onclick = (e) => {
            if (modoRemocao) {
                e.preventDefault(); 
                mostrarModalConfirmacao(site.url);
            } else {
                window.open(`https://${site.url}`, "_blank");
            }
        };                    

        container.append(card);

        });

}




function addApp() {
    const inputField = el("input", { placeholder: "Ex: youtube.com", class: "modal-input" });

    const card = el("div", { class: "card",  style:{padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.2)"}},
        el("div", {},
            el("p", {}, "Add a app or website here"),
            inputField,
            el("button", {
                id: "btn-submit",
                onclick: () => {



                        
                            let valor = inputField.value.trim().toLowerCase();

                            if (valor === "") return;

                            if (!valor.includes(".")) {
                                valor += ".com";
                            }
                            /*
                           if (!valor.includes("://")) {
                                valor = "https://" + valor;
                            }
                              */  
                            app(valor);
                            fecharModal();
                            containerAdd.classList.remove("active");
                            document.querySelector(".containerAddApps").textContent = "";

                }
            }, "Add"),
            el("button", {style:{
                cursor:"pointer",
                border: "none",
                     background: "#808080ff",
                     borderRadius: "8px", 
                     color: "white",
                    padding: "12px",
                    margin:"12px"        
                }, 
                onclick:fecharModal
            }, "Cancel")
        )
    );

    return card;
}




function app(link){
    const dominioPuro = link.replace(/^https?:\/\//, "")
    const novoApp = {
         url:link,
         logo:`https://www.google.com/s2/favicons?domain=${dominioPuro}&sz=64`
    }
    salvaAppLocal(novoApp);
    renderizaApps(); 
    
}

const btn = document.querySelector("#btn-add");
btn.addEventListener("click", () => {
    containerAdd.textContent = ""; // Limpa lixo antigo
    containerAdd.classList.add("active");
    const addCard = addApp();
    containerAdd.append(addCard);
});



const btnRemoverModo = document.querySelector("#btn-remove"); 

btnRemoverModo.addEventListener("click", () => {
    modoRemocao = !modoRemocao;
    
    if (modoRemocao) {
        btnRemoverModo.textContent = "Cancel Remove";
        alternarAvisoRemocao(true);
    } else {
        desativarModoRemocao();
    }
});

function desativarModoRemocao() {
    modoRemocao = false;
    btnRemoverModo.textContent = "Remove App";
    alternarAvisoRemocao(false);
}



renderizaApps();