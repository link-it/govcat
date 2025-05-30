package org.govway.catalogo.reverse_proxy.filters;

import javax.servlet.*;
import javax.servlet.annotation.WebFilter;
import javax.servlet.http.HttpServletRequest;
import java.io.IOException;

@WebFilter(urlPatterns = {"/servizi/*", "/adesioni/*", "/gruppi/*", "/domini/*", "/soggetti/*", "/organizzazioni/*", "/client/*", "/utenti/*", "/classi-utente/*", "/pdnd/*", "/notifications/*", "/profile/*", "/dashboard/*"})
public class FrontendRoutingFilter implements Filter {

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        // No initialization required
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;
        String path = req.getRequestURI().substring(req.getContextPath().length());

        // Forward only non-static, non-servlet, non-API frontend routes to index.jsp
        if (shouldForwardToFrontend(path)) {
            RequestDispatcher dispatcher = request.getRequestDispatcher("/index.jsp");
            dispatcher.forward(request, response);
        } else {
            chain.doFilter(request, response);
        }
    }

    private boolean shouldForwardToFrontend(String path) {
        // Static resource extensions
        if (path.matches(".*\\.(js|css|ico|png|jpg|jpeg|gif|woff2?|ttf|eot|svg|json|map|html)$")) {
            return false;
        }

        // Backend endpoints - let them pass
        return !path.contains("/proxyServlet");
    }

    @Override
    public void destroy() {
        // No destruction required
    }
}
