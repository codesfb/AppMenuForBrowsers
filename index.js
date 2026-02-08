document.addEventListener('DOMContentLoaded', () => {
    // --- LÓGICA DE TEMA ---
    function aplicarTema(r, g, b) {
        const corCSS = `rgb(${r}, ${g}, ${b})`; 
        document.documentElement.style.setProperty('--bg-system', corCSS);

        const brilho = Math.round(((parseInt(r) * 299) + (parseInt(g) * 587) + (parseInt(b) * 114)) / 1000);
        
        if (brilho > 125) {
            document.documentElement.style.setProperty('--text-system', '#000000');
            document.documentElement.style.setProperty('--hover-bg', 'rgba(0,0,0,0.1)');
        } else {
            document.documentElement.style.setProperty('--text-system', '#ffffff');
            document.documentElement.style.setProperty('--hover-bg', 'rgba(255,255,255,0.1)');
        }
    }

    if (window.chrome && chrome.theme && chrome.theme.getCurrent) {
        chrome.theme.getCurrent((theme) => {
            if (theme && theme.colors) {
                const corEncontrada = theme.colors.toolbar || theme.colors.frame;
                if (corEncontrada) {
                    aplicarTema(corEncontrada[0], corEncontrada[1], corEncontrada[2]);
                }
            }
        });
    }

    // --- INICIALIZAÇÃO DOS EVENTOS ---
    const containerAdd = document.querySelector(".containerAddApps");
    const btnAdd = document.querySelector("#btn-add");
    const btnRemoverModo = document.querySelector("#btn-remove");
    const settingsBtn = document.querySelector("#settings-menu-btn");
    const settingsMenu = document.querySelector("#settings-menu");

    btnAdd.addEventListener("click", () => {
        containerAdd.textContent = ""; 
        containerAdd.classList.add("active");
        const addCard = addApp();
        containerAdd.append(addCard);
    });

    btnRemoverModo.addEventListener("click", () => {
        modoRemocao = true;
        alternarAvisoRemocao(true);
        renderizaApps(); // Re-renderiza para aplicar estilos de remoção
        settingsMenu.classList.remove("active"); 
    });

    settingsBtn.addEventListener("click", (e) => {
        e.stopPropagation(); 
        settingsMenu.classList.toggle("active");
    });

    document.addEventListener("click", () => {
        settingsMenu.classList.remove("active");
    });

    settingsMenu.addEventListener("click", (e) => e.stopPropagation());

    // Renderização inicial
    init();
});

// --- FUNÇÕES AUXILIARES DE UI ---

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
    const containerAdd = document.querySelector(".containerAddApps");
    containerAdd.classList.remove("active");
    containerAdd.textContent = "";
}

function extrairNomeLimpo(url) {
    let nome = url.replace(/^https?:\/\//, "").replace("www.", "");
    nome = nome.split('.')[0];
    return nome.charAt(0).toUpperCase() + nome.slice(1);
}

// --- LÓGICA DE MODO DE REMOÇÃO ---

let modoRemocao = false;

function alternarAvisoRemocao(mostrar) {
    const statusContainer = document.querySelector("#remover-status");
    if (!statusContainer) return;
    
    statusContainer.innerHTML = ""; 

    if (mostrar) {
        const areaAviso = el("div", { 
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
    renderizaApps();
}

// --- MODAIS (ADICIONAR E CONFIRMAR) ---

function mostrarModalConfirmacao(url, nome) {
    const containerAdd = document.querySelector(".containerAddApps");
    containerAdd.textContent = "";  
    containerAdd.classList.add("active");
    const cardConfirmacao = el("div", { class: "card" }, 
        el("p", { style: { color: "#e4e8ec", marginBottom: "20px" } }, `Are you sure you want to remove ${nome}?`),
        el("div", { style: { display: "flex", gap: "10px", justifyContent: "center" } },
            el("button", { 
                style: {
                    cursor: "pointer", border: "none", background: "#e75c5c",
                    borderRadius: "8px", color: "white", padding: "12px", fontWeight: "bold"
                },
                onclick: async () => {
                    await removeApp(url); 
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

function addApp() {
    const inputField = el("input", { placeholder: "Ex: youtube.com", class: "modal-input" });

    const card = el("div", { class: "card" },
        el("p", {}, "Add a app or website here"),
        inputField,
        el("div", { style: { display: "flex", gap: "10px", justifyContent: "center", marginTop: "20px" } },
            el("button", {
                id: "btn-submit", 
                onclick: async () => {
                    let valor = inputField.value.trim().toLowerCase();
                    if (valor === "") return;
                    if (!valor.includes(".")) {
                        valor += ".com";
                    }
                    await app(valor);
                    fecharModal();
                }
            }, "Add"),
            el("button", {
                style: {
                    cursor: "pointer", border: "none", background: "#4a4a4e",
                    borderRadius: "8px", color: "white", padding: "12px"
                }, 
                onclick: fecharModal
            }, "Cancel")
        )
    );
    return card;
}

// --- LÓGICA DE ARMAZENAMENTO E SINCRONIZAÇÃO ---

let storage; // Nossa camada de abstração

// Objeto para interagir com localStorage (com interface async para consistência)
const localStore = {
    get: async () => JSON.parse(localStorage.getItem("mylinks")) || [],
    set: async (links) => localStorage.setItem("mylinks", JSON.stringify(links)),
    clear: async () => localStorage.removeItem("mylinks")
};

// Objeto para interagir com chrome.storage.sync
const syncStore = {
    get: async () => {
        const { mylinks = [] } = await chrome.storage.sync.get("mylinks");
        return mylinks;
    },
    set: async (links) => await chrome.storage.sync.set({ mylinks: links }),
    clear: async () => await chrome.storage.sync.remove("mylinks")
};

/**
 * Define qual estratégia de armazenamento usar (local ou sync)
 */
async function setStorageStrategy(useSync) {
    storage = useSync ? syncStore : localStore;
    if (window.chrome && chrome.storage && chrome.storage.sync) {
        await chrome.storage.sync.set({ useSync: useSync });
    }
    updateSyncButtonState(useSync);
}

/**
 * Atualiza o botão de sincronização no menu de configurações
 */
function updateSyncButtonState(isSyncEnabled) {
    const syncBtn = document.querySelector("#sync-toggle-btn");
    if (!syncBtn) return;

    syncBtn.innerHTML = isSyncEnabled
        ? `<span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"></path><path d="m13.294 7.292-4.588 4.588 1.414 1.414 3.174-3.173 3.173 3.173 1.415-1.414-4.588-4.588c-.39-.39-1.023-.39-1.412 0z"></path></svg> Stop Syncing</span>`
        : `<span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"></path><path d="M13 12.586V8h-2v4.586l-2.293-2.293-1.414 1.414L12 16.414l4.707-4.707-1.414-1.414L13 12.586z"></path></svg> Sign In to Sync</span>`;

    syncBtn.onclick = isSyncEnabled ? handleStopSync : handleStartSync;
}

async function handleStartSync() {
    const localLinks = await localStore.get();
    if (localLinks.length > 0) {
        const syncLinks = await syncStore.get();
        const combined = [...syncLinks, ...localLinks];
        const uniqueLinks = Array.from(new Map(combined.map(item => [item.url, item])).values());
        await syncStore.set(uniqueLinks);
        await localStore.clear();
    }
    await setStorageStrategy(true);
    await renderizaApps();
    document.querySelector("#settings-menu").classList.remove("active");
}

async function handleStopSync() {
    await setStorageStrategy(false);
    await renderizaApps();
    document.querySelector("#settings-menu").classList.remove("active");
}

function mostrarTelaDeEscolha() {
    const container = document.querySelector(".containerApps");
    container.textContent = "";

    const cardEscolha = el("div", { class: "card", style: { textAlign: 'left', padding: '30px' } },
        el("h2", { style: { textAlign: 'center', marginBottom: '15px' } }, "Welcome!"),
        el("p", { style: { color: "#e4e8ec", textAlign: 'center', marginBottom: '30px' } }, "How do you want to save your apps?"),
        el("button", {
            onclick: handleStartSync,
            style: { width: '100%', padding: '15px', marginBottom: '10px', background: '#6c5ce7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }
        }, "Sign In & Sync"),
        el("p", { style: { fontSize: '12px', color: 'gray', textAlign: 'center', marginTop: '-5px', marginBottom: '25px' } }, "Saves and syncs across your devices."),
        el("button", {
            onclick: async () => { await setStorageStrategy(false); await renderizaApps(); },
            style: { width: '100%', padding: '15px', background: '#4a4a4e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }
        }, "Use Locally Only"),
        el("p", { style: { fontSize: '12px', color: 'gray', textAlign: 'center', marginTop: '5px' } }, "Saves only on this computer.")
    );
    container.append(cardEscolha);
}

async function init() {
    if (!window.chrome || !chrome.storage || !chrome.storage.sync) {
        storage = localStore;
        updateSyncButtonState(false);
        await renderizaApps();
        return;
    }

    const { useSync } = await chrome.storage.sync.get({ useSync: null });
    const localData = await localStore.get();

    if (useSync === null && localData.length === 0) {
        mostrarTelaDeEscolha();
        updateSyncButtonState(false);
    } else {
        const isSyncEnabled = useSync === true || (useSync === null && localData.length > 0);
        await setStorageStrategy(isSyncEnabled);
        await renderizaApps();
    }
}

// --- LÓGICA PRINCIPAL DO APP (COM CHROME.STORAGE.SYNC) ---

async function app(link) {
    const dominioPuro = link.replace(/^https?:\/\//, "");
    const novoApp = {
         url: link,
         logo: `https://www.google.com/s2/favicons?domain=${dominioPuro}&sz=64`
    };
    await salvaAppLocal(novoApp);
    await renderizaApps(); 
}

async function salvaAppLocal(newlink) {
    const links = await storage.get();
    if (!links.some(site => site.url === newlink.url)) {
        links.push(newlink);
        await storage.set(links);
    }
}

async function removeApp(urlParaRemover) {
    const links = await storage.get();
    const novosLinks = links.filter(site => site.url !== urlParaRemover);
    await storage.set(novosLinks);
    await renderizaApps();
}

async function renderizaApps() {
    const container = document.querySelector(".containerApps");
    container.textContent = "";
    
    const sites = await storage.get();

    if (sites.length === 0) {
        container.append(el("p", { style: { color: "gray", gridColumn: "1 / -1", textAlign: "center" } }, "You don't have any apps yet. Add one!"));
        return;
    }

    sites.forEach(site => {
        const nomeLimpo = extrairNomeLimpo(site.url);
        const card = el("div", { class: `app-card ${modoRemocao ? 'modo-excluir' : ''}` },
            el("a", { href: `https://${site.url}`, target: "_blank" },
                el("img", { src: site.logo }),
                el("p", {}, nomeLimpo)
            )
        );

        card.onclick = (e) => {
            if (modoRemocao) {
                e.preventDefault(); 
                mostrarModalConfirmacao(site.url, nomeLimpo);
            } else {
                window.open(`https://${site.url}`, "_blank");
            }
        };                    
        container.append(card);
    });
}
