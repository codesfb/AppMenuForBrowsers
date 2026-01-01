document.addEventListener('DOMContentLoaded', () => {
    function aplicarTema(r, g, b) {
        const corCSS = `rgb(${r}, ${g}, ${b})`;
        document.documentElement.style.setProperty('--bg-system', corCSS);

        const brilho = Math.round(((parseInt(r) * 299) + (parseInt(g) * 587) + (parseInt(b) * 114)) / 1000);
        
        if (brilho > 125) {
            document.documentElement.style.setProperty('--text-system', '#000000');
            document.documentElement.style.setProperty('--hover-bg', 'rgba(0,0,0,0.1)');
            document.documentElement.style.setProperty('--card-bg', '#ffffff');
            document.documentElement.style.setProperty('--card-border', '#dadce0');
        } else {
            document.documentElement.style.setProperty('--text-system', '#ffffff');
            document.documentElement.style.setProperty('--hover-bg', 'rgba(255,255,255,0.1)');
            document.documentElement.style.setProperty('--card-bg', `rgba(${r+20}, ${g+20}, ${b+20}, 1)`);
            document.documentElement.style.setProperty('--card-border', 'rgba(255,255,255,0.1)');
        }
        console.log("Cor aplicada:", corCSS);
    }

    if (chrome.theme && chrome.theme.getCurrent) {
        chrome.theme.getCurrent((theme) => {
            console.log("Tema detectado:", theme); // Debug: veja o que o Brave retorna

            if (theme && theme.colors) {
                // Tenta pegar a cor nesta ordem de prioridade
                const corEncontrada = 
                    theme.colors.toolbar || 
                    theme.colors.frame || 
                    theme.colors.header || 
                    theme.colors.ntp_background;

                if (corEncontrada) {
                    aplicarTema(corEncontrada[0], corEncontrada[1], corEncontrada[2]);
                } else {
                    console.log("Tema existe, mas sem cores definidas. Usando CSS padrão.");
                }
            } else {
                console.log("Nenhum tema personalizado detectado (Modo Padrão do Brave).");
            }
        });
    }
});



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
    const statusContainer = document.querySelector("#remover-status");
    if (!statusContainer) return;
    const avisoId = "aviso-area-interna";
    
    statusContainer.innerHTML = ""; 

    if (mostrar) {
        
        const areaAviso = el("div", { 
            id: avisoId, 
            style: { display: "flex", width: "100%", gap: "10px", alignItems: "center", marginBottom: "10px" } 
        }, 
            el("div", { class: "aviso-estilo" }, "Select an app to remove"),
            el("button", { 
                class: "btn-cancelar-remocao",
                onclick: () => desativarModoRemocao() 
            }, "Cancel")
        );
        
        statusContainer.append(areaAviso);
    }
}



function desativarModoRemocao() {
    modoRemocao = false;
    alternarAvisoRemocao(false);
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
    const cardConfirmacao = el("div", { class: "card" }, 
        el("p", { style: { color: "#e4e8ec", marginBottom: "20px" } }, `Are you sure you want to remove ${url}?`),
        el("div", { style: { display: "flex", gap: "10px", justifyContent: "center" } },
            el("button", { 
                style: {
                    cursor: "pointer", border: "none", background: "#e75c5c",
                    borderRadius: "8px", color: "white", padding: "12px", fontWeight: "bold"
                },
                onclick: () => {
                    removeApp(url);
                    fecharModal();
                    desativarModoRemocao();
                }
            }, "Yes, remove"),
            el("button", { 
                style: {
                    cursor: "pointer", border: "none", background: "#4a4a4e",
                    borderRadius: "8px", color: "white", padding: "12px"
                }, 
                onclick: fecharModal
            }, "Cancel")
        )
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
     const card = el("div", { class: `app-card ${modoRemocao ? 'modo-excluir' : ''}` },
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


const containerAdd = document.querySelector(".containerAddApps");
const containerApps = document.querySelector(".containerApps");


const btnAdd = document.querySelector("#btn-add");

//console.log(containerAdd.textContent)
btnAdd.addEventListener("click", () => {
    containerAdd.textContent = ""; 
    containerAdd.classList.add("active");
    const addCard = addApp();
    containerAdd.append(addCard);
});



const btnRemoverModo = document.querySelector("#btn-remove"); 


btnRemoverModo.addEventListener("click", () => {
    modoRemocao = true;
    alternarAvisoRemocao(true);
    settingsMenu.classList.remove("active"); 
});

function desativarModoRemocao() {
    modoRemocao = false;
    btnRemoverModo.textContent = "Remove App";
    alternarAvisoRemocao(false);
}

const settingsBtn = document.querySelector("#settings-menu-btn");
const settingsMenu = document.querySelector("#settings-menu");


settingsBtn.addEventListener("click", (e) => {
    e.stopPropagation(); 
    settingsMenu.classList.toggle("active");
});


document.addEventListener("click", () => {
    settingsMenu.classList.remove("active");
});


settingsMenu.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => settingsMenu.classList.remove("active"));
});

renderizaApps();