{
	"credenziali": {
		"modalita_accesso": "${modalitaAccesso}",
		<#if modalitaAccesso="https">"certificato": {
			"archivio": "${certificato}",
			"tipo_certificato": "${tipoCertificato}",
			"alias": "selfsigned",
			"password": "password",
			"tipo": "certificato"
		}</#if>
	}
}