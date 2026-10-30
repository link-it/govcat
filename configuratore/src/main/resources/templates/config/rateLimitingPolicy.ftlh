{
	"nome": "${nome}",
	"stato": "${stato}",
	"ridefinito": true,
	"soglia_ridefinita": true,
	"soglia_valore": ${sogliaValore},
	"configurazione": {
		"identificazione": "criteri",
		"metrica": "${metrica}",
		"intervallo": "${intervallo}"
	}<#if applicativoFruitore??>,
	"filtro": {
		"applicativo_fruitore": "${applicativoFruitore}"
	}</#if>
}
