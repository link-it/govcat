<%@page import="org.govway.catalogo.reverse_proxy.security.ReverseProxyUserDetails"%>
<%@page import="java.util.Map"%>
<%@page import="org.springframework.security.core.userdetails.UserDetails"%>
<%@page import="org.springframework.security.core.context.SecurityContextHolder"%>
<%@page import="org.springframework.security.core.Authentication"%>
<%@ page contentType="text/html; charset=UTF-8" %>
  <%
  String context = request.getContextPath();
  
  String idPaginaS = request.getParameter("idPagina");
  
  int idPagina = 1;
  
  try {
	  idPagina = Integer.parseInt(idPaginaS);
  } catch (Exception e){
	  
  }
  
  String active = "home";
  String activeClass = "active";
  
  Authentication a = SecurityContextHolder.getContext().getAuthentication();
  
  String utente = null;
	if(a != null){
		  
		if(a.getPrincipal() instanceof ReverseProxyUserDetails) {
			ReverseProxyUserDetails userDetails = (ReverseProxyUserDetails) a.getPrincipal();
			if(userDetails != null){
				utente = userDetails.getUsername();
			}
			
		} else if(a.getPrincipal() instanceof UserDetails) {
			UserDetails userDetails = (UserDetails) a.getPrincipal();
			if(userDetails != null){
				utente = userDetails.getUsername();
			}
		}   
	  }
  
	String utenteString = utente;
  %>
  
  <nav class="navbar navbar-expand-md navbar-dark bg-dark mb-4">
  <div class="container">
    <a class="navbar-brand" href="<%=context %>/index.jsp" title="Home" style="display: none;">Home</a> 
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarCollapse" aria-controls="navbarCollapse" aria-expanded="false" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navbarCollapse">
      <ul class="navbar-nav me-auto mb-2 mb-md-0">
        <li class="nav-item">
          <a class="nav-link <%= idPagina == 1 ? activeClass : ""%>" aria-current="page" href="<%=context %>/index.jsp" style="padding-left: 0px;">Catalogo API ModI - Error Page</a>
        </li>
      </ul>
       <% if(utente != null){%>
		<span class="navbar-text" style="display: none;">
			<%=utenteString %>        
      	</span>
		<% }%>
    </div>
  </div>
</nav>
  