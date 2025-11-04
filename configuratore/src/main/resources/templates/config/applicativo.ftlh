{
	<#if descrizione??>"descrizione": "${descrizione}",</#if>
	"credenziali": {
		"modalita_accesso": "${modalitaAccesso}",
		<#if modalitaAccesso="https">"certificato": {
			"archivio": "${certificato}",
			"tipo_certificato": "CER",
			"alias": "selfsigned",
			"password": "password",
			"tipo": "certificato"
		}</#if><#if modalitaAccesso="token">
		"token_policy": "${tokenPolicy}",
		"identificativo": "${tokenIdentificativo}"</#if>
	},
	"nome": "${nomeApplicativo}"
}