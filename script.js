console.log("SCRIPT JS CHARGÉ !");

let map = L.map('map').setView([46.8, 2.5], 6);
let currentLayer = null;

// Fond de carte OSM
L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '© OpenStreetMap'
}).addTo(map);

console.log("Tile layer chargé !");

// Fonction de chargement d'une couche GeoJSON
async function loadLayer(filename) {

    console.log("Chargement :", "data/" + filename);

    // Charger le fichier GeoJSON
    const response = await fetch("data/" + filename);
    const data = await response.json();

    console.log("GeoJSON chargé =", data);

    // Supprimer la couche si elle existe
    if (currentLayer) map.removeLayer(currentLayer);

    // Récupérer la strate choisie
    const selectedStrate = Number(document.getElementById("strateSlider").value);
    console.log("Strate choisie =", selectedStrate);

    // Ajouter la couche filtrée
	currentLayer = L.geoJSON(data, {	
		filter: feature => {
			// Récupérer le texte saisi dans la recherche
			const search = document.getElementById("searchInput").value.trim().toLowerCase();

			// Récupérer le nom (compatible toutes couches)
			const nom =
				feature.properties.NomFR ||
				feature.properties.Nom ||
				feature.properties.nom ||
				"";

			// ===== CAS 1 : Recherche par nom → filtre EXCLUSIF =====
			if (search !== "") {
				return nom.toLowerCase().includes(search);
			}

			// ===== CAS 2 : PAS de recherche → filtre normal par strate =====

			const s = feature.properties.Strate ?? feature.properties.strate;
			const strateOK = Number(s) === selectedStrate;

			return strateOK;
		},

        style: {
            color: "blue",
            weight: 2,
            fillOpacity: 0.3
        },
        onEachFeature: (feature, layer) => {
            const nom = feature.properties.Nom || feature.properties.Name || "Sans nom";
            const strate = feature.properties.Strate;
            const pop = feature.properties.Population;

            // Popup au clic
            layer.bindPopup(
                `<b>${nom}</b><br>
                <b>Strate :</b> ${strate}<br>
                <b>Population :</b> ${pop}`
            );

            // Tooltip au survol
            layer.bindTooltip(`${nom} — Pop : ${pop}`, { sticky: true });

            // Highlight au survol
            layer.on("mouseover", function () {
                layer.setStyle({ weight: 4, color: "orange" });
            });

            layer.on("mouseout", function () {
                currentLayer.resetStyle(layer);
            });
        }
    }).addTo(map);


	// Vérifier si la couche contient des entités
	const nbFeatures = currentLayer.getLayers().length;

	if (nbFeatures === 0) {
		alert("Aucune collectivité ne correspond à votre critère.");
		return; // Ne pas essayer de centrer la carte
	}

	// Si au moins une entité, on ajuste la vue
	console.log("Bounds =", currentLayer.getBounds());
	map.fitBounds(currentLayer.getBounds());

    // Ajuster la vue si des objets existent
    try {
        map.fitBounds(currentLayer.getBounds());
    } catch (e) {
        console.warn("Aucun objet pour cette strate.");
    }
}

// --- Événements interface ---

document.addEventListener("DOMContentLoaded", () => {

    const selectLayer = document.getElementById("layerSelect");
    const selectStrate = document.getElementById("strateSlider");
    const searchInput = document.getElementById("searchInput");

    // Charger immédiatement
    loadLayer(selectLayer.value);

    // Changement de couche
    selectLayer.addEventListener("change", () => {
        loadLayer(selectLayer.value);
    });

    // Changement de strate
    selectStrate.addEventListener("change", () => {
        loadLayer(selectLayer.value);
    });

    // Recherche texte
    searchInput.addEventListener("input", () => {
        loadLayer(selectLayer.value);
    });

});


