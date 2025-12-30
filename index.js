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


listaApps = {}
const containerAdd = document.querySelector(".containerAddApps");
const containerApps = document.querySelector(".containerApps");
function addApp(){
    const card = el("div",{class:"card",
        style:{padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.2)"} },
        el("div",{},
        el("p",{},"Add a app or website here"),
        el("input",{placeholder:"Ex:Youtube.com"}, ),
        el("button",{id:"btn-submit"},"add")
    ))
    return card 
}


function app(link){
   
    const novoApp = {
         url:link,
         logo:`https://www.google.com/s2/favicons?domain=${link}&sz=64`
    }

    //salvaApp(newApp)

    const appVisual = el("div", { class: "app-card" },
        el("a", { href: `https://${novoApp.url}`, target: "_blank" },
            el("img", { src: novoApp.logo }),
            el("p", {}, novoApp.url)
        )
    );
    containerApps.append(appVisual);

}

const btn = document.querySelector("#btn-add");



btn.addEventListener("click", ()=>{
        const add = addApp();
       
        containerAdd.append(add);

        const btnAdd = document.querySelector("#btn-submit");
        btnAdd.addEventListener("click", (e)=>{
        
        const input = e.target.parentElement.querySelector("input");
        console.log(input.value);
        app(input.value);
        containerAdd.textContent="";

    });

        

});

