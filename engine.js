const SUPABASE_URL = "https://galfzyrjjjmwkorsqusw.supabase.co";
const SUPABASE_KEY = "sb_publishable_ikJvGHdDKXvlt4ybL83TwQ_-GCyF1Ii";

const SUPABASE_REST = `${SUPABASE_URL}/rest/v1`;

const supabaseHeaders = {
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json"
};


// ===============================
// RÉCUPÉRER LES PRODUITS
// ===============================

async function getProducts() {
    const response = await fetch(
        `${SUPABASE_REST}/products?select=*`,
        {
            method: "GET",
            headers: supabaseHeaders
        }
    );

    if (!response.ok) {
        throw new Error("Impossible de récupérer les produits.");
    }

    return await response.json();
}


// ===============================
// NORMALISATION DE L'ÂGE
// ===============================

function ageMatches(dogAge, productAge) {
    const age = dogAge.toLowerCase();
    const product = productAge.toLowerCase();

    if (product.includes("tous")) {
        return true;
    }

    if (age === "chiot") {
        return product.includes("chiot") || product.includes("puppy");
    }

    if (age === "adulte") {
        return product.includes("adulte") || product.includes("adult");
    }

    return false;
}


// ===============================
// NORMALISATION DES TAILLES
// ===============================
//
// Le formulaire ne possède QUE 4 tailles :
//
// Petite
// Moyenne
// Grande
// Très grande
//
// Un produit peut couvrir :
// - 1 taille
// - 2 tailles
// - toutes les tailles
// ===============================

function getProductSizes(productSize) {

    const size = productSize
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    // Toutes tailles
    if (
        size.includes("toutes") ||
        size.includes("all")
    ) {
        return [
            "petite",
            "moyenne",
            "grande",
            "tres grande"
        ];
    }

    // Petite + moyenne
    if (
        size.includes("petite") &&
        size.includes("moyenne")
    ) {
        return [
            "petite",
            "moyenne"
        ];
    }

    // Grande + très grande
    if (
        size.includes("grande") &&
        size.includes("tres grande")
    ) {
        return [
            "grande",
            "tres grande"
        ];
    }

    // Petite uniquement
    if (size.includes("petite")) {
        return ["petite"];
    }

    // Très grande uniquement
    if (size.includes("tres grande")) {
        return ["tres grande"];
    }

    // Grande uniquement
    if (size.includes("grande")) {
        return ["grande"];
    }

    // Moyenne uniquement
    if (size.includes("moyenne")) {
        return ["moyenne"];
    }

    return [];
}


function sizeMatches(selectedSize, productSize) {

    const sizesCoveredByProduct = getProductSizes(productSize);

    return sizesCoveredByProduct.includes(selectedSize);
}


// ===============================
// FILTRER LES PRODUITS
// ===============================

function filterProducts(products, criteria) {

    return products.filter(product => {

        const correctAge = ageMatches(
            criteria.age,
            product.dog_age
        );

        const correctSize = sizeMatches(
            criteria.size,
            product.dog_size
        );

        const correctType =
            Number(product.type) === Number(criteria.type);

        return (
            correctAge &&
            correctSize &&
            correctType
        );
    });
}


// ===============================
// AFFICHAGE
// ===============================

function displayProducts(products) {

    const results = document.getElementById("results");

    results.innerHTML = "";

    if (products.length === 0) {

        results.innerHTML = `
            <div class="no-results">
                <h2>Aucune formule trouvée</h2>
                <p>
                    Nous n'avons pas trouvé de produit correspondant
                    exactement à vos critères.
                </p>
            </div>
        `;

        return;
    }

    products.forEach(product => {

        const card = document.createElement("article");

        card.className = "product-card";

        card.innerHTML = `
            <div class="product-image">
                <img
                    src="${product.image}"
                    alt="${escapeHTML(product.name)}"
                    onerror="this.style.display='none'"
                >
            </div>

            <div class="product-content">

                <span class="product-type">
                    Type ${product.type}
                </span>

                <h2>${escapeHTML(product.name)}</h2>

                <p class="product-size">
                    ${escapeHTML(product.dog_size)}
                </p>

                <p class="product-benefits">
                    ${escapeHTML(product.objective)}
                </p>

                <div class="benefits">
                    ${formatBenefits(product.benefits)}
                </div>

            </div>
        `;

        results.appendChild(card);
    });
}


// ===============================
// FORMATAGE DES BÉNÉFICES
// ===============================

function formatBenefits(text) {

    if (!text) return "";

    return `
        <details>
            <summary>Voir les bénéfices</summary>
            <p>${escapeHTML(text)}</p>
        </details>
    `;
}


// ===============================
// PROTECTION HTML
// ===============================

function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ===============================
// INITIALISATION
// ===============================

document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("recommendation-form");

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        const age = document.getElementById("age").value;
        const size = document.getElementById("size").value;
        const type = document.getElementById("type").value;

        const button = form.querySelector("button");

        button.disabled = true;
        button.textContent = "Recherche...";

        try {

            const products = await getProducts();

            const filteredProducts = filterProducts(
                products,
                {
                    age,
                    size,
                    type
                }
            );

            // On retire le formulaire
            form.style.display = "none";

            // On affiche les résultats
            const results = document.getElementById("results");
            results.style.display = "grid";

            displayProducts(filteredProducts);

        } catch (error) {

            console.error(error);

            alert(
                "Une erreur est survenue lors de la recherche des produits."
            );

            button.disabled = false;
            button.textContent = "Voir les produits";
        }

    });

});