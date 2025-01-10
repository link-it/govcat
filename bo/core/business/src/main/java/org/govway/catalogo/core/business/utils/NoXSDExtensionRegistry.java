/*
 * GovCat - GovWay API Catalogue
 * https://github.com/link-it/govcat
 *
 * Copyright (c) 2021-2025 Link.it srl (https://link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */
package org.govway.catalogo.core.business.utils;


import javax.wsdl.*;
import javax.wsdl.extensions.*;
import javax.wsdl.extensions.soap.*;
import javax.wsdl.extensions.soap12.*;
import javax.wsdl.extensions.mime.*;
import com.ibm.wsdl.extensions.soap.*;
import com.ibm.wsdl.extensions.soap12.*;
import com.ibm.wsdl.extensions.http.*;
import com.ibm.wsdl.extensions.mime.*;

public class NoXSDExtensionRegistry extends ExtensionRegistry
{
  public static final long serialVersionUID = 1;

  public NoXSDExtensionRegistry()
  {
    SOAPAddressSerializer soapAddressSer = new SOAPAddressSerializer();

    registerSerializer(Port.class,
                       SOAPConstants.Q_ELEM_SOAP_ADDRESS,
                       soapAddressSer);
    registerDeserializer(Port.class,
                         SOAPConstants.Q_ELEM_SOAP_ADDRESS,
                         soapAddressSer);
    mapExtensionTypes(Port.class,
                      SOAPConstants.Q_ELEM_SOAP_ADDRESS,
                      SOAPAddressImpl.class);

    SOAPBindingSerializer soapBindingSer = new SOAPBindingSerializer();

    registerSerializer(Binding.class,
                       SOAPConstants.Q_ELEM_SOAP_BINDING,
                       soapBindingSer);
    registerDeserializer(Binding.class,
                         SOAPConstants.Q_ELEM_SOAP_BINDING,
                         soapBindingSer);
    mapExtensionTypes(Binding.class,
                      SOAPConstants.Q_ELEM_SOAP_BINDING,
                      SOAPBindingImpl.class);

    SOAPHeaderSerializer soapHeaderSer = new SOAPHeaderSerializer();

    registerSerializer(BindingInput.class,
                       SOAPConstants.Q_ELEM_SOAP_HEADER,
                       soapHeaderSer);
    registerDeserializer(BindingInput.class,
                         SOAPConstants.Q_ELEM_SOAP_HEADER,
                         soapHeaderSer);
    mapExtensionTypes(BindingInput.class,
                      SOAPConstants.Q_ELEM_SOAP_HEADER,
                      SOAPHeaderImpl.class);
    registerSerializer(BindingOutput.class,
                       SOAPConstants.Q_ELEM_SOAP_HEADER,
                       soapHeaderSer);
    registerDeserializer(BindingOutput.class,
                         SOAPConstants.Q_ELEM_SOAP_HEADER,
                         soapHeaderSer);
    mapExtensionTypes(BindingOutput.class,
                      SOAPConstants.Q_ELEM_SOAP_HEADER,
                      SOAPHeaderImpl.class);
    mapExtensionTypes(SOAPHeader.class,
                      SOAPConstants.Q_ELEM_SOAP_HEADER_FAULT,
                      SOAPHeaderFaultImpl.class);
    registerSerializer(MIMEPart.class,                     
                       SOAPConstants.Q_ELEM_SOAP_HEADER,   
                       soapHeaderSer);                     
    registerDeserializer(MIMEPart.class,                   
                         SOAPConstants.Q_ELEM_SOAP_HEADER, 
                         soapHeaderSer);                   
    mapExtensionTypes(MIMEPart.class,                      
                      SOAPConstants.Q_ELEM_SOAP_HEADER,    
                      SOAPHeaderImpl.class);               

    SOAPBodySerializer soapBodySer = new SOAPBodySerializer();

    registerSerializer(BindingInput.class,
                       SOAPConstants.Q_ELEM_SOAP_BODY,
                       soapBodySer);
    registerDeserializer(BindingInput.class,
                         SOAPConstants.Q_ELEM_SOAP_BODY,
                         soapBodySer);
    mapExtensionTypes(BindingInput.class,
                      SOAPConstants.Q_ELEM_SOAP_BODY,
                      SOAPBodyImpl.class);
    registerSerializer(BindingOutput.class,
                       SOAPConstants.Q_ELEM_SOAP_BODY,
                       soapBodySer);
    registerDeserializer(BindingOutput.class,
                         SOAPConstants.Q_ELEM_SOAP_BODY,
                         soapBodySer);
    mapExtensionTypes(BindingOutput.class,
                      SOAPConstants.Q_ELEM_SOAP_BODY,
                      SOAPBodyImpl.class);
    registerSerializer(MIMEPart.class,
                       SOAPConstants.Q_ELEM_SOAP_BODY,
                       soapBodySer);
    registerDeserializer(MIMEPart.class,
                         SOAPConstants.Q_ELEM_SOAP_BODY,
                         soapBodySer);
    mapExtensionTypes(MIMEPart.class,
                      SOAPConstants.Q_ELEM_SOAP_BODY,
                      SOAPBodyImpl.class);

    SOAPFaultSerializer soapFaultSer = new SOAPFaultSerializer();

    registerSerializer(BindingFault.class,
                       SOAPConstants.Q_ELEM_SOAP_FAULT,
                       soapFaultSer);
    registerDeserializer(BindingFault.class,
                         SOAPConstants.Q_ELEM_SOAP_FAULT,
                         soapFaultSer);
    mapExtensionTypes(BindingFault.class,
                      SOAPConstants.Q_ELEM_SOAP_FAULT,
                      SOAPFaultImpl.class);

    SOAPOperationSerializer soapOperationSer = new SOAPOperationSerializer();

    registerSerializer(BindingOperation.class,
                       SOAPConstants.Q_ELEM_SOAP_OPERATION,
                       soapOperationSer);
    registerDeserializer(BindingOperation.class,
                         SOAPConstants.Q_ELEM_SOAP_OPERATION,
                         soapOperationSer);
    mapExtensionTypes(BindingOperation.class,
                      SOAPConstants.Q_ELEM_SOAP_OPERATION,
                      SOAPOperationImpl.class);
    
    
    SOAP12AddressSerializer soap12AddressSer = new SOAP12AddressSerializer();

    registerSerializer(Port.class,
                       SOAP12Constants.Q_ELEM_SOAP_ADDRESS,
                       soap12AddressSer);
    registerDeserializer(Port.class,
                         SOAP12Constants.Q_ELEM_SOAP_ADDRESS,
                         soap12AddressSer);
    mapExtensionTypes(Port.class,
                      SOAP12Constants.Q_ELEM_SOAP_ADDRESS,
                      SOAP12AddressImpl.class);

    SOAP12BindingSerializer soap12BindingSer = new SOAP12BindingSerializer();

    registerSerializer(Binding.class,
                       SOAP12Constants.Q_ELEM_SOAP_BINDING,
                       soap12BindingSer);
    registerDeserializer(Binding.class,
                         SOAP12Constants.Q_ELEM_SOAP_BINDING,
                         soap12BindingSer);
    mapExtensionTypes(Binding.class,
                      SOAP12Constants.Q_ELEM_SOAP_BINDING,
                      SOAP12BindingImpl.class);

    SOAP12HeaderSerializer soap12HeaderSer = new SOAP12HeaderSerializer();

    registerSerializer(BindingInput.class,
                       SOAP12Constants.Q_ELEM_SOAP_HEADER,
                       soap12HeaderSer);
    registerDeserializer(BindingInput.class,
                         SOAP12Constants.Q_ELEM_SOAP_HEADER,
                         soap12HeaderSer);
    mapExtensionTypes(BindingInput.class,
                      SOAP12Constants.Q_ELEM_SOAP_HEADER,
                      SOAP12HeaderImpl.class);
    registerSerializer(BindingOutput.class,
                       SOAP12Constants.Q_ELEM_SOAP_HEADER,
                       soap12HeaderSer);
    registerDeserializer(BindingOutput.class,
                         SOAP12Constants.Q_ELEM_SOAP_HEADER,
                         soap12HeaderSer);
    mapExtensionTypes(BindingOutput.class,
                      SOAP12Constants.Q_ELEM_SOAP_HEADER,
                      SOAP12HeaderImpl.class);
    mapExtensionTypes(SOAP12Header.class,
                      SOAP12Constants.Q_ELEM_SOAP_HEADER_FAULT,
                      SOAP12HeaderFaultImpl.class);
    registerSerializer(MIMEPart.class,                       
                       SOAP12Constants.Q_ELEM_SOAP_HEADER,   
                       soap12HeaderSer);                     
    registerDeserializer(MIMEPart.class,                     
                         SOAP12Constants.Q_ELEM_SOAP_HEADER, 
                         soap12HeaderSer);                   
    mapExtensionTypes(MIMEPart.class,                        
                      SOAP12Constants.Q_ELEM_SOAP_HEADER,    
                      SOAP12HeaderImpl.class);               

    SOAP12BodySerializer soap12BodySer = new SOAP12BodySerializer();

    registerSerializer(BindingInput.class,
                       SOAP12Constants.Q_ELEM_SOAP_BODY,
                       soap12BodySer);
    registerDeserializer(BindingInput.class,
                         SOAP12Constants.Q_ELEM_SOAP_BODY,
                         soap12BodySer);
    mapExtensionTypes(BindingInput.class,
                      SOAP12Constants.Q_ELEM_SOAP_BODY,
                      SOAP12BodyImpl.class);
    registerSerializer(BindingOutput.class,
                       SOAP12Constants.Q_ELEM_SOAP_BODY,
                       soap12BodySer);
    registerDeserializer(BindingOutput.class,
                         SOAP12Constants.Q_ELEM_SOAP_BODY,
                         soap12BodySer);
    mapExtensionTypes(BindingOutput.class,
                      SOAP12Constants.Q_ELEM_SOAP_BODY,
                      SOAP12BodyImpl.class);
    registerSerializer(MIMEPart.class,
                       SOAP12Constants.Q_ELEM_SOAP_BODY,
                       soap12BodySer);
    registerDeserializer(MIMEPart.class,
                         SOAP12Constants.Q_ELEM_SOAP_BODY,
                         soap12BodySer);
    mapExtensionTypes(MIMEPart.class,
                      SOAP12Constants.Q_ELEM_SOAP_BODY,
                      SOAP12BodyImpl.class);

    SOAP12FaultSerializer soap12FaultSer = new SOAP12FaultSerializer();

    registerSerializer(BindingFault.class,
                       SOAP12Constants.Q_ELEM_SOAP_FAULT,
                       soap12FaultSer);
    registerDeserializer(BindingFault.class,
                         SOAP12Constants.Q_ELEM_SOAP_FAULT,
                         soap12FaultSer);
    mapExtensionTypes(BindingFault.class,
                      SOAP12Constants.Q_ELEM_SOAP_FAULT,
                      SOAP12FaultImpl.class);

    SOAP12OperationSerializer soap12OperationSer = new SOAP12OperationSerializer();

    registerSerializer(BindingOperation.class,
                       SOAP12Constants.Q_ELEM_SOAP_OPERATION,
                       soap12OperationSer);
    registerDeserializer(BindingOperation.class,
                         SOAP12Constants.Q_ELEM_SOAP_OPERATION,
                         soap12OperationSer);
    mapExtensionTypes(BindingOperation.class,
                      SOAP12Constants.Q_ELEM_SOAP_OPERATION,
                      SOAP12OperationImpl.class);

    HTTPAddressSerializer httpAddressSer = new HTTPAddressSerializer();

    registerSerializer(Port.class,
                       HTTPConstants.Q_ELEM_HTTP_ADDRESS,
                       httpAddressSer);
    registerDeserializer(Port.class,
                         HTTPConstants.Q_ELEM_HTTP_ADDRESS,
                         httpAddressSer);
    mapExtensionTypes(Port.class,
                      HTTPConstants.Q_ELEM_HTTP_ADDRESS,
                      HTTPAddressImpl.class);

    HTTPOperationSerializer httpOperationSer = new HTTPOperationSerializer();

    registerSerializer(BindingOperation.class,
                       HTTPConstants.Q_ELEM_HTTP_OPERATION,
                       httpOperationSer);
    registerDeserializer(BindingOperation.class,
                         HTTPConstants.Q_ELEM_HTTP_OPERATION,
                         httpOperationSer);
    mapExtensionTypes(BindingOperation.class,
                      HTTPConstants.Q_ELEM_HTTP_OPERATION,
                      HTTPOperationImpl.class);

    HTTPBindingSerializer httpBindingSer = new HTTPBindingSerializer();

    registerSerializer(Binding.class,
                       HTTPConstants.Q_ELEM_HTTP_BINDING,
                       httpBindingSer);
    registerDeserializer(Binding.class,
                         HTTPConstants.Q_ELEM_HTTP_BINDING,
                         httpBindingSer);
    mapExtensionTypes(Binding.class,
                      HTTPConstants.Q_ELEM_HTTP_BINDING,
                      HTTPBindingImpl.class);

    HTTPUrlEncodedSerializer httpUrlEncodedSer =
      new HTTPUrlEncodedSerializer();

    registerSerializer(BindingInput.class,
                       HTTPConstants.Q_ELEM_HTTP_URL_ENCODED,
                       httpUrlEncodedSer);
    registerDeserializer(BindingInput.class,
                         HTTPConstants.Q_ELEM_HTTP_URL_ENCODED,
                         httpUrlEncodedSer);
    mapExtensionTypes(BindingInput.class,
                      HTTPConstants.Q_ELEM_HTTP_URL_ENCODED,
                      HTTPUrlEncodedImpl.class);

    HTTPUrlReplacementSerializer httpUrlReplacementSer =
      new HTTPUrlReplacementSerializer();

    registerSerializer(BindingInput.class,
                       HTTPConstants.Q_ELEM_HTTP_URL_REPLACEMENT,
                       httpUrlReplacementSer);
    registerDeserializer(BindingInput.class,
                         HTTPConstants.Q_ELEM_HTTP_URL_REPLACEMENT,
                         httpUrlReplacementSer);
    mapExtensionTypes(BindingInput.class,
                      HTTPConstants.Q_ELEM_HTTP_URL_REPLACEMENT,
                      HTTPUrlReplacementImpl.class);

    MIMEContentSerializer mimeContentSer = new MIMEContentSerializer();

    registerSerializer(BindingInput.class,
                       MIMEConstants.Q_ELEM_MIME_CONTENT,
                       mimeContentSer);
    registerDeserializer(BindingInput.class,
                         MIMEConstants.Q_ELEM_MIME_CONTENT,
                         mimeContentSer);
    mapExtensionTypes(BindingInput.class,
                      MIMEConstants.Q_ELEM_MIME_CONTENT,
                      MIMEContentImpl.class);
    registerSerializer(BindingOutput.class,
                       MIMEConstants.Q_ELEM_MIME_CONTENT,
                       mimeContentSer);
    registerDeserializer(BindingOutput.class,
                         MIMEConstants.Q_ELEM_MIME_CONTENT,
                         mimeContentSer);
    mapExtensionTypes(BindingOutput.class,
                      MIMEConstants.Q_ELEM_MIME_CONTENT,
                      MIMEContentImpl.class);
    registerSerializer(MIMEPart.class,
                       MIMEConstants.Q_ELEM_MIME_CONTENT,
                       mimeContentSer);
    registerDeserializer(MIMEPart.class,
                         MIMEConstants.Q_ELEM_MIME_CONTENT,
                         mimeContentSer);
    mapExtensionTypes(MIMEPart.class,
                      MIMEConstants.Q_ELEM_MIME_CONTENT,
                      MIMEContentImpl.class);

    MIMEMultipartRelatedSerializer mimeMultipartRelatedSer =
      new MIMEMultipartRelatedSerializer();

    registerSerializer(BindingInput.class,
                       MIMEConstants.Q_ELEM_MIME_MULTIPART_RELATED,
                       mimeMultipartRelatedSer);
    registerDeserializer(BindingInput.class,
                         MIMEConstants.Q_ELEM_MIME_MULTIPART_RELATED,
                         mimeMultipartRelatedSer);
    mapExtensionTypes(BindingInput.class,
                      MIMEConstants.Q_ELEM_MIME_MULTIPART_RELATED,
                      MIMEMultipartRelatedImpl.class);
    registerSerializer(BindingOutput.class,
                       MIMEConstants.Q_ELEM_MIME_MULTIPART_RELATED,
                       mimeMultipartRelatedSer);
    registerDeserializer(BindingOutput.class,
                         MIMEConstants.Q_ELEM_MIME_MULTIPART_RELATED,
                         mimeMultipartRelatedSer);
    mapExtensionTypes(BindingOutput.class,
                      MIMEConstants.Q_ELEM_MIME_MULTIPART_RELATED,
                      MIMEMultipartRelatedImpl.class);
    registerSerializer(MIMEPart.class,
                       MIMEConstants.Q_ELEM_MIME_MULTIPART_RELATED,
                       mimeMultipartRelatedSer);
    registerDeserializer(MIMEPart.class,
                         MIMEConstants.Q_ELEM_MIME_MULTIPART_RELATED,
                         mimeMultipartRelatedSer);
    mapExtensionTypes(MIMEPart.class,
                      MIMEConstants.Q_ELEM_MIME_MULTIPART_RELATED,
                      MIMEMultipartRelatedImpl.class);
    mapExtensionTypes(MIMEMultipartRelated.class,
                      MIMEConstants.Q_ELEM_MIME_PART,
                      MIMEPartImpl.class);

    MIMEMimeXmlSerializer mimeMimeXmlSer = new MIMEMimeXmlSerializer();

    registerSerializer(BindingInput.class,
                       MIMEConstants.Q_ELEM_MIME_MIME_XML,
                       mimeMimeXmlSer);
    registerDeserializer(BindingInput.class,
                         MIMEConstants.Q_ELEM_MIME_MIME_XML,
                         mimeMimeXmlSer);
    mapExtensionTypes(BindingInput.class,
                      MIMEConstants.Q_ELEM_MIME_MIME_XML,
                      MIMEMimeXmlImpl.class);
    registerSerializer(BindingOutput.class,
                       MIMEConstants.Q_ELEM_MIME_MIME_XML,
                       mimeMimeXmlSer);
    registerDeserializer(BindingOutput.class,
                         MIMEConstants.Q_ELEM_MIME_MIME_XML,
                         mimeMimeXmlSer);
    mapExtensionTypes(BindingOutput.class,
                      MIMEConstants.Q_ELEM_MIME_MIME_XML,
                      MIMEMimeXmlImpl.class);
    registerSerializer(MIMEPart.class,
                       MIMEConstants.Q_ELEM_MIME_MIME_XML,
                       mimeMimeXmlSer);
    registerDeserializer(MIMEPart.class,
                         MIMEConstants.Q_ELEM_MIME_MIME_XML,
                         mimeMimeXmlSer);
    mapExtensionTypes(MIMEPart.class,
                      MIMEConstants.Q_ELEM_MIME_MIME_XML,
                      MIMEMimeXmlImpl.class);
                      
    //Register the schema parser
    
//    mapExtensionTypes(Types.class, SchemaConstants.Q_ELEM_XSD_1999,
//        SchemaImpl.class);
//    registerDeserializer(Types.class, SchemaConstants.Q_ELEM_XSD_1999,
//        new SchemaDeserializer());
//    registerSerializer(Types.class, SchemaConstants.Q_ELEM_XSD_1999,
//        new SchemaSerializer());
//
//    mapExtensionTypes(Types.class, SchemaConstants.Q_ELEM_XSD_2000,
//        SchemaImpl.class);
//    registerDeserializer(Types.class, SchemaConstants.Q_ELEM_XSD_2000,
//        new SchemaDeserializer());
//    registerSerializer(Types.class, SchemaConstants.Q_ELEM_XSD_2000,
//        new SchemaSerializer());
//
//    mapExtensionTypes(Types.class, SchemaConstants.Q_ELEM_XSD_2001,
//        SchemaImpl.class);
//    registerDeserializer(Types.class, SchemaConstants.Q_ELEM_XSD_2001,
//        new SchemaDeserializer());
//    registerSerializer(Types.class, SchemaConstants.Q_ELEM_XSD_2001,
//        new SchemaSerializer());

  }
}