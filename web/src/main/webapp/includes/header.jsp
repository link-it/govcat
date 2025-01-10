<%@ page contentType="text/html; charset=UTF-8" %>

  <head>
   <%
    String context = request.getContextPath();
    String titoloPagina = request.getParameter("titoloPagina");
    %>
    
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta name="description" content="">
    <meta name="author" content="">

    <title><%=titoloPagina %></title>
    
    <link href="css/roboto/roboto-fontface.css" rel="stylesheet" type="text/css">

    <!-- Bootstrap core CSS -->
    <link href="css/bootstrap_frame.css" rel="stylesheet">

    <!-- Bootstrap core CSS -->
    <link href="css/custom.css" rel="stylesheet">
    
    <link rel="shortcut icon" href="images/favicon.ico" type="image/x-icon" /> 
    
    
     <!-- Bootstrap core JavaScript
    ================================================== -->
    <!-- Placed at the end of the document so the pages load faster -->
    <script src="js/jquery-3.6.0.min.js"></script>
    <script>window.jQuery || document.write('<script src="js/jquery-3.6.0.min.js"><\/script>')</script>
    <script src="js/bootstrap.bundle.js"></script>
  </head>