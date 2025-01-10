<%@page import="java.io.ByteArrayOutputStream"%>
<%@page import="java.io.PrintWriter"%>
<%@ page contentType="text/html; charset=UTF-8" %>
<%@ page isErrorPage = "true" %>
<!doctype html>
<html lang="en">

<jsp:include page="includes/header.jsp" flush="true">
	<jsp:param name="titoloPagina" value="Modi Catalogo | Errore" />
</jsp:include>
<body>

	<jsp:include page="includes/navbar.jsp" flush="true">
		<jsp:param name="idPagina" value="1" />
	</jsp:include>
	
	<main role="main" class="container my-md-4">
		<h3>Errore</h3>
		<div class="border-top pt-4">
			<div class="row">
          		<div class="col-md-12">
          			<div class="card">
          				<div class="card-body">
	          				<ul class="list-group list-group-flush">
	          					<li class="list-group-item">Si e' verificato un errore durante l'esecuzione dell'operazione</li>
	          					<% if(exception != null){
	          					%>
	          						<li class="list-group-item"><%= exception.getMessage() %></li>
	          					<%  }%>
							  </ul>
						</div>
					</div>
				</div>
			</div>
		</div>
	</main>
	<!-- /.container -->

	<jsp:include page="includes/footer.jsp" flush="true"></jsp:include>
</body>
</html>
