package testsuite;
import org.govway.catalogo.core.business.utils.WsdlUtils;
import org.govway.catalogo.core.business.utils.WsdlUtils.BINDING;
import org.govway.catalogo.core.orm.entity.ApiEntity.PROTOCOLLO;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

public class WsdlUtilsTest {

	private static final String SIMPLE_WSDL =
		    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
		    "<definitions xmlns=\"http://schemas.xmlsoap.org/wsdl/\"\n" +
		    "             xmlns:soap=\"http://schemas.xmlsoap.org/wsdl/soap/\"\n" +
		    "             xmlns:tns=\"http://example.com/wsdl\"\n" +
		    "             xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\"\n" +
		    "             name=\"SimpleService\"\n" +
		    "             targetNamespace=\"http://example.com/wsdl\">\n" +
		    "    <types/>\n" +
		    "    <message name=\"SimpleRequest\">\n" +
		    "        <part name=\"parameters\" element=\"xsd:string\"/>\n" +
		    "    </message>\n" +
		    "    <message name=\"SimpleResponse\">\n" +
		    "        <part name=\"parameters\" element=\"xsd:string\"/>\n" +
		    "    </message>\n" +
		    "    <portType name=\"SimplePortType\">\n" +
		    "        <operation name=\"SimpleOperation\">\n" +
		    "            <input message=\"tns:SimpleRequest\"/>\n" +
		    "            <output message=\"tns:SimpleResponse\"/>\n" +
		    "        </operation>\n" +
		    "    </portType>\n" +
		    "    <binding name=\"SimpleBinding\" type=\"tns:SimplePortType\">\n" +
		    "        <soap:binding style=\"document\" transport=\"http://schemas.xmlsoap.org/soap/http\"/>\n" +
		    "        <operation name=\"SimpleOperation\">\n" +
		    "            <soap:operation soapAction=\"urn:simpleAction\"/>\n" +
		    "            <input>\n" +
		    "                <soap:body use=\"literal\"/>\n" +
		    "            </input>\n" +
		    "            <output>\n" +
		    "                <soap:body use=\"literal\"/>\n" +
		    "            </output>\n" +
		    "        </operation>\n" +
		    "    </binding>\n" +
		    "    <service name=\"SimpleService\">\n" +
		    "        <port name=\"SimplePort\" binding=\"tns:SimpleBinding\">\n" +
		    "            <soap:address location=\"http://example.com/simple\"/>\n" +
		    "        </port>\n" +
		    "    </service>\n" +
		    "</definitions>\n";

    private byte[] getWsdlBytes() {
        return SIMPLE_WSDL.getBytes(StandardCharsets.UTF_8);
    }

    @Test
    void testGetProtocolloApi_shouldReturnWSDL11() throws Exception {
        PROTOCOLLO protocollo = WsdlUtils.getProtocolloApi(getWsdlBytes());
        assertEquals(PROTOCOLLO.WSDL11, protocollo);
    }

    @Test
    void testGetBindingApi_shouldReturnSOAP11() throws Exception {
        BINDING binding = WsdlUtils.getBindingApi(getWsdlBytes());
        assertEquals(BINDING.SOAP11, binding);
    }

    @Test
    void testGetOperationFromWsdl_shouldContainExpectedOperation() throws Exception {
        List<String> operations = WsdlUtils.getOperationFromWsdl(getWsdlBytes());
        assertEquals(1, operations.size());
        assertEquals("SimplePortType.SimpleOperation", operations.get(0));
    }

    @Test
    void testGetInfoFromWsdl_shouldReturnServiceWithOperation() throws Exception {
        var serviceInfoList = WsdlUtils.getInfoFromWsdl(getWsdlBytes());
        assertEquals(1, serviceInfoList.size());

        var service = serviceInfoList.get(0);
        assertEquals("SimplePortType", service.getNome());
        assertTrue(service.getOperazioni().containsKey("SimpleOperation"));

        var operation = service.getOperazioni().get("SimpleOperation");
        assertEquals("SimpleOperation", operation.getNome());
        assertEquals(1, operation.getSoapActions().size());
        assertEquals("urn:simpleAction", operation.getSoapActions().get(0).getValue());
    }

    // Issue 412: parsing concorrente di WSDL diversi (binding SOAP 1.1 e 1.2) da piu` thread.
    // Con DocumentBuilder/XPathExpression statici condivisi alcune invocazioni fallivano o
    // restituivano il protocollo di un altro WSDL.
    @Test
    void testGetProtocolloApi_concorrente() throws Exception {
        byte[] wsdl11 = getWsdlBytes();
        byte[] wsdl12 = SIMPLE_WSDL.replace("http://schemas.xmlsoap.org/wsdl/soap/", "http://schemas.xmlsoap.org/wsdl/soap12/")
                .getBytes(StandardCharsets.UTF_8);

        int threads = 16;
        int iterazioni = 50;
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        try {
            CountDownLatch start = new CountDownLatch(1);
            List<Future<Void>> esiti = new ArrayList<>();
            for (int t = 0; t < threads; t++) {
                boolean soap12 = t % 2 == 0;
                esiti.add(executor.submit(() -> {
                    start.await();
                    for (int i = 0; i < iterazioni; i++) {
                        PROTOCOLLO protocollo = WsdlUtils.getProtocolloApi(soap12 ? wsdl12 : wsdl11);
                        assertEquals(soap12 ? PROTOCOLLO.WSDL12 : PROTOCOLLO.WSDL11, protocollo);
                    }
                    return null;
                }));
            }
            start.countDown();
            for (Future<Void> esito : esiti) {
                esito.get(60, TimeUnit.SECONDS);
            }
        } finally {
            executor.shutdownNow();
        }
    }
}
