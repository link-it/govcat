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
/*
 * eToscana Compliance
 * eToscana Compliance
 *
 * OpenAPI spec version: 1.0.0
 * Contact: info@link.it
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 */

package org.govway.catalogo.gest.clients.govwayconfig;

import java.io.IOException;
import java.io.StringReader;
import java.lang.reflect.Type;
import java.text.DateFormat;
import java.text.ParseException;
import java.text.ParsePosition;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import com.google.gson.FieldNamingPolicy;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonElement;
import com.google.gson.JsonParseException;
import com.google.gson.TypeAdapter;
import com.google.gson.TypeAdapterFactory;
import com.google.gson.internal.bind.util.ISO8601Utils;
import com.google.gson.reflect.TypeToken;
import com.google.gson.stream.JsonReader;
import com.google.gson.stream.JsonToken;
import com.google.gson.stream.JsonWriter;

import io.gsonfire.GsonFireBuilder;
import io.gsonfire.TypeSelector;
import org.govway.catalogo.gest.clients.govwayconfig.impl.JSON;
import org.govway.catalogo.gest.clients.govwayconfig.model.APIImplAutenticazioneApiKey;
import org.govway.catalogo.gest.clients.govwayconfig.model.APIImplAutenticazioneBasic;
import org.govway.catalogo.gest.clients.govwayconfig.model.APIImplAutenticazioneCustom;
import org.govway.catalogo.gest.clients.govwayconfig.model.APIImplAutenticazioneDisabilitata;
import org.govway.catalogo.gest.clients.govwayconfig.model.APIImplAutenticazioneHttps;
import org.govway.catalogo.gest.clients.govwayconfig.model.APIImplAutenticazionePrincipal;
import org.govway.catalogo.gest.clients.govwayconfig.model.APIImplAutorizzazioneAbilitata;
import org.govway.catalogo.gest.clients.govwayconfig.model.APIImplAutorizzazioneCustom;
import org.govway.catalogo.gest.clients.govwayconfig.model.APIImplAutorizzazioneDisabilitata;
import org.govway.catalogo.gest.clients.govwayconfig.model.APIImplAutorizzazioneXACMLView;
import org.govway.catalogo.gest.clients.govwayconfig.model.ApiImplUrlInvocazioneView;
import org.govway.catalogo.gest.clients.govwayconfig.model.ApiInterfacciaRest;
import org.govway.catalogo.gest.clients.govwayconfig.model.ApiInterfacciaSoap;
import org.govway.catalogo.gest.clients.govwayconfig.model.ControlloAccessiAutorizzazioneView;
import org.govway.catalogo.gest.clients.govwayconfig.model.OneOfApiBaseTipoInterfaccia;
import org.govway.catalogo.gest.clients.govwayconfig.model.OneOfControlloAccessiAutenticazioneAutenticazione;
import org.govway.catalogo.gest.clients.govwayconfig.model.OneOfControlloAccessiAutorizzazioneViewAutorizzazione;
import org.govway.catalogo.gest.clients.govwayconfig.model.TipoApiEnum;
import org.govway.catalogo.gest.clients.govwayconfig.model.TipoAutenticazioneEnum;
import org.govway.catalogo.gest.clients.govwayconfig.model.TipoAutorizzazioneEnum;

public class ExtendedJSON extends JSON {
    private Gson gson;
    private boolean isLenientOnJson = false;
    private DateTypeAdapter dateTypeAdapter = new DateTypeAdapter();
    private SqlDateTypeAdapter sqlDateTypeAdapter = new SqlDateTypeAdapter();
    private OffsetDateTimeTypeAdapter offsetDateTimeTypeAdapter = new OffsetDateTimeTypeAdapter();
    private LocalDateTypeAdapter localDateTypeAdapter = new LocalDateTypeAdapter();
    private OneOfApiBaseTipoInterfacciaAdapter oneOfApiBaseTipoInterfacciaAdapter = new OneOfApiBaseTipoInterfacciaAdapter();
    private OneOfControlloAccessiAutenticazioneAutenticazioneAdapter oneOfControlloAccessiAutenticazioneAutenticazione = new OneOfControlloAccessiAutenticazioneAutenticazioneAdapter();
    private OneOfControlloAccessiAutenticazioneAutorizzazioneAdapter oneOfControlloAccessiAutenticazioneAutorizzazione = new OneOfControlloAccessiAutenticazioneAutorizzazioneAdapter();
    private ApiImplUrlInvocazioneViewAdapter apiImplUrlInvocazioneView = new ApiImplUrlInvocazioneViewAdapter();
    private EnumAdapterFactory enumAdapterFactory = new EnumAdapterFactory();

    public static GsonBuilder createGson() {
        GsonFireBuilder fireBuilder = 
                new GsonFireBuilder()
        		  .registerTypeSelector(OneOfApiBaseTipoInterfaccia.class, new TypeSelector<OneOfApiBaseTipoInterfaccia>() {
        			    @Override
        			    public Class<? extends OneOfApiBaseTipoInterfaccia> getClassForElement(JsonElement readElement) {
        			      String type = readElement.getAsJsonObject().get("protocollo").getAsString();
        			      if(type.equals("soap")){
        			        return ApiInterfacciaSoap.class; 
        			      } else if(type.equals("rest")) {
        			        return ApiInterfacciaRest.class;
        			      } else {
        			        return null; //returning null will trigger Gson's default behavior
        			      }
        			    }
        			  })
        		  .registerTypeSelector(OneOfControlloAccessiAutenticazioneAutenticazione.class, new TypeSelector<OneOfControlloAccessiAutenticazioneAutenticazione>() {
        			    @Override
        			    public Class<? extends OneOfControlloAccessiAutenticazioneAutenticazione> getClassForElement(JsonElement readElement) {
        			      String type = readElement.getAsJsonObject().get("tipo").getAsString();
      			      if(type.equals("disabilitato")){
      	  			        return APIImplAutenticazioneDisabilitata.class; 
      	  			      } else if(type.equals("http-basic")){
      	  			    	return APIImplAutenticazioneBasic.class;
      	  			      } else if(type.equals("https")){
      				    	return APIImplAutenticazioneHttps.class;
      	  			      } else if(type.equals("principal")){
      	  			    	return APIImplAutenticazionePrincipal.class;
      	  			      } else if(type.equals("api-key")){
      				    	return APIImplAutenticazioneApiKey.class;
      	  			      } else if(type.equals("custom")){
      	  			    	return APIImplAutenticazioneCustom.class;
      	  			      } else {
      	  			        return null; //returning null will trigger Gson's default behavior
      	  			      }
        			    }
        			  })
        		  .registerTypeSelector(OneOfControlloAccessiAutorizzazioneViewAutorizzazione.class, new TypeSelector<OneOfControlloAccessiAutorizzazioneViewAutorizzazione>() {
      			    @Override
      			    public Class<? extends OneOfControlloAccessiAutorizzazioneViewAutorizzazione> getClassForElement(JsonElement readElement) {
      			      String type = readElement.getAsJsonObject().get("tipo").getAsString();
    			      if(type.equals("disabilitato")){
    	  			        return APIImplAutorizzazioneDisabilitata.class; 
    	  			      } else if(type.equals("abilitato")){
    	  			    	return APIImplAutorizzazioneAbilitata.class;
    	  			      } else if(type.equals("xacml-Policy")){
    				    	return APIImplAutorizzazioneXACMLView.class;
    	  			      } else if(type.equals("custom")){
    	  			    	return APIImplAutorizzazioneCustom.class;
    	  			      } else {
    	  			        return null; //returning null will trigger Gson's default behavior
    	  			      }
      			    }
      			  })
        		  ;

        
        return fireBuilder.createGsonBuilder();
    }

    
    public static void main(String[] args) throws IOException {
//        JsonReader reader;
//        try {
//            reader = new JsonReader(new FileReader("/tmp/a"));
//            reader.beginObject();
//
//            while (reader.hasNext()){
//                String name = reader.nextName();
//
//                if (reader.
//                    System.out.println(name +" "+reader.nextString());
////                } else if ("model".equals(name)){
////                    System.out.println(reader.nextString());
////                } else if ("year".equals(name)){
////                    System.out.println(reader.nextString());
////                } else if ("colors".equals(name)){
////
////                    reader.beginArray();
////                    while (reader.hasNext()){
////                        System.out.println("\t" + reader.nextString());
////                    }
////                    reader.endArray();
////
////                } else {
////                    reader.skipValue();
////                }
//            }
//
//            reader.endObject();
//            reader.close();
//
//        } catch (FileNotFoundException e) {
//            System.err.print(e.getMessage());
//        } catch (IOException e) {
//            System.err.print(e.getMessage());
//        }

    	OneOfControlloAccessiAutenticazioneAutenticazioneAdapter oneOfControlloAccessiAutenticazioneAutenticazione = new ExtendedJSON(). new OneOfControlloAccessiAutenticazioneAutenticazioneAdapter();
    	OneOfControlloAccessiAutenticazioneAutorizzazioneAdapter oneOfControlloAccessiAutenticazioneAutorizzazione = new ExtendedJSON(). new OneOfControlloAccessiAutenticazioneAutorizzazioneAdapter();

    	Gson gson = new GsonFireBuilder()
        		  .registerTypeSelector(OneOfApiBaseTipoInterfaccia.class, new TypeSelector<OneOfApiBaseTipoInterfaccia>() {
        			    @Override
        			    public Class<? extends OneOfApiBaseTipoInterfaccia> getClassForElement(JsonElement readElement) {
        			      String type = readElement.getAsJsonObject().get("protocollo").getAsString();
        			      if(type.equals("soap")){
        			        return ApiInterfacciaSoap.class; 
        			      } else if(type.equals("rest")) {
        			        return ApiInterfacciaRest.class;
        			      } else {
        			        return null; //returning null will trigger Gson's default behavior
        			      }
        			    }
        			  })
        		  .registerTypeSelector(OneOfControlloAccessiAutenticazioneAutenticazione.class, new TypeSelector<OneOfControlloAccessiAutenticazioneAutenticazione>() {
        			    @Override
        			    public Class<? extends OneOfControlloAccessiAutenticazioneAutenticazione> getClassForElement(JsonElement readElement) {
        			      String type = readElement.getAsJsonObject().get("tipo").getAsString();
      			      if(type.equals("disabilitato")){
      	  			        return APIImplAutenticazioneDisabilitata.class; 
      	  			      } else if(type.equals("http-basic")){
      	  			    	return APIImplAutenticazioneBasic.class;
      	  			      } else if(type.equals("https")){
      				    	return APIImplAutenticazioneHttps.class;
      	  			      } else if(type.equals("principal")){
      	  			    	return APIImplAutenticazionePrincipal.class;
      	  			      } else if(type.equals("api-key")){
      				    	return APIImplAutenticazioneApiKey.class;
      	  			      } else if(type.equals("custom")){
      	  			    	return APIImplAutenticazioneCustom.class;
      	  			      } else {
      	  			        return null; //returning null will trigger Gson's default behavior
      	  			      }
        			    }
        			  })
        		  .registerTypeSelector(OneOfControlloAccessiAutorizzazioneViewAutorizzazione.class, new TypeSelector<OneOfControlloAccessiAutorizzazioneViewAutorizzazione>() {
        			    @Override
        			    public Class<? extends OneOfControlloAccessiAutorizzazioneViewAutorizzazione> getClassForElement(JsonElement readElement) {
        			      String type = readElement.getAsJsonObject().get("tipo").getAsString();
      			      if(type.equals("disabilitato")){
      	  			        return APIImplAutorizzazioneDisabilitata.class; 
      	  			      } else if(type.equals("abilitato")){
      	  			    	return APIImplAutorizzazioneAbilitata.class;
      	  			      } else if(type.equals("xacml-Policy")){
      				    	return APIImplAutorizzazioneXACMLView.class;
      	  			      } else if(type.equals("custom")){
      	  			    	return APIImplAutorizzazioneCustom.class;
      	  			      } else {
      	  			        return null; //returning null will trigger Gson's default behavior
      	  			      }
        			    }
        			  })
        		  .createGsonBuilder()
        		  .registerTypeAdapter(OneOfControlloAccessiAutenticazioneAutenticazione.class, oneOfControlloAccessiAutenticazioneAutenticazione)
        		  .registerTypeAdapter(OneOfControlloAccessiAutorizzazioneViewAutorizzazione.class, oneOfControlloAccessiAutenticazioneAutorizzazione)
                  .registerTypeAdapter(ApiImplUrlInvocazioneViewAdapter.class, new ExtendedJSON(). new ApiImplUrlInvocazioneViewAdapter())
        		  .registerTypeAdapterFactory(new ExtendedJSON(). new EnumAdapterFactory())
                  .setFieldNamingStrategy(FieldNamingPolicy.LOWER_CASE_WITH_UNDERSCORES)
        		  .create()
                  
                  ;

    	
//    	String json = "{\"autorizzazione\":{\"tipo\":\"abilitato\", \"token\": true, \"token_claims\": \"abcde\"},\"ridefinito\":true}";
//    	ControlloAccessiAutorizzazioneView caav = gson.fromJson(json, ControlloAccessiAutorizzazioneView.class);
//		
//		System.out.println(((APIImplAutorizzazioneAbilitata)caav.getAutorizzazione()).isToken());
//		System.out.println(((APIImplAutorizzazioneAbilitata)caav.getAutorizzazione()).getTokenClaims());
	}
    public ExtendedJSON() {
		gson = createGson()
  		  .registerTypeAdapterFactory(enumAdapterFactory)
            .registerTypeAdapter(OneOfApiBaseTipoInterfaccia.class, oneOfApiBaseTipoInterfacciaAdapter)
            .registerTypeAdapter(OneOfControlloAccessiAutenticazioneAutenticazione.class, oneOfControlloAccessiAutenticazioneAutenticazione)
            .registerTypeAdapter(OneOfControlloAccessiAutorizzazioneViewAutorizzazione.class, oneOfControlloAccessiAutenticazioneAutorizzazione)
            .registerTypeAdapter(ApiImplUrlInvocazioneViewAdapter.class, apiImplUrlInvocazioneView)
            .registerTypeAdapter(Date.class, dateTypeAdapter)
            .registerTypeAdapter(java.sql.Date.class, sqlDateTypeAdapter)
            .registerTypeAdapter(OffsetDateTime.class, offsetDateTimeTypeAdapter)
            .registerTypeAdapter(LocalDate.class, localDateTypeAdapter)
            .setFieldNamingStrategy(FieldNamingPolicy.LOWER_CASE_WITH_UNDERSCORES)
            .create();
    }

    /**
     * Get Gson.
     *
     * @return Gson
     */
    public Gson getGson() {
        return gson;
    }

    /**
     * Set Gson.
     *
     * @param gson Gson
     * @return JSON
     */
    public ExtendedJSON setGson(Gson gson) {
        this.gson = gson;
        return this;
    }

    public ExtendedJSON setLenientOnJson(boolean lenientOnJson) {
        isLenientOnJson = lenientOnJson;
        return this;
    }

    /**
     * Serialize the given Java object into JSON string.
     *
     * @param obj Object
     * @return String representation of the JSON
     */
    public String serialize(Object obj) {
        return gson.toJson(obj);
    }

    /**
     * Deserialize the given JSON string to Java object.
     *
     * @param <T>        Type
     * @param body       The JSON string
     * @param returnType The type to deserialize into
     * @return The deserialized Java object
     */
    @SuppressWarnings("unchecked")
    public <T> T deserialize(String body, Type returnType) {
        try {
            if (isLenientOnJson) {
                JsonReader jsonReader = new JsonReader(new StringReader(body));
                // see https://google-gson.googlecode.com/svn/trunk/gson/docs/javadocs/com/google/gson/stream/JsonReader.html#setLenient(boolean)
                jsonReader.setLenient(true);
                return gson.fromJson(jsonReader, returnType);
            } else {
                return gson.fromJson(body, returnType);
            }
        } catch (JsonParseException e) {
            // Fallback processing when failed to parse JSON form response body:
            // return the response body string directly for the String return type;
            if (returnType.equals(String.class))
                return (T) body;
            else throw (e);
        }
    }

    /**
     * Gson TypeAdapter for JSR310 OffsetDateTime type
     */
    public static class OffsetDateTimeTypeAdapter extends TypeAdapter<OffsetDateTime> {

        private DateTimeFormatter formatter;

        public OffsetDateTimeTypeAdapter() {
            this(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
        }

        public OffsetDateTimeTypeAdapter(DateTimeFormatter formatter) {
            this.formatter = formatter;
        }

        public void setFormat(DateTimeFormatter dateFormat) {
            this.formatter = dateFormat;
        }

        @Override
        public void write(JsonWriter out, OffsetDateTime date) throws IOException {
            if (date == null) {
                out.nullValue();
            } else {
                out.value(formatter.format(date));
            }
        }

        @Override
        public OffsetDateTime read(JsonReader in) throws IOException {
            switch (in.peek()) {
                case NULL:
                    in.nextNull();
                    return null;
                default:
                    String date = in.nextString();
                    if (date.endsWith("+0000")) {
                        date = date.substring(0, date.length()-5) + "Z";
                    }
                    return OffsetDateTime.parse(date, formatter);
            }
        }
    }

    /**
     * Gson TypeAdapter for JSR310 LocalDate type
     */
    public class LocalDateTypeAdapter extends TypeAdapter<LocalDate> {

        private DateTimeFormatter formatter;

        public LocalDateTypeAdapter() {
            this(DateTimeFormatter.ISO_LOCAL_DATE);
        }

        public LocalDateTypeAdapter(DateTimeFormatter formatter) {
            this.formatter = formatter;
        }

        public void setFormat(DateTimeFormatter dateFormat) {
            this.formatter = dateFormat;
        }

        @Override
        public void write(JsonWriter out, LocalDate date) throws IOException {
            if (date == null) {
                out.nullValue();
            } else {
                out.value(formatter.format(date));
            }
        }

        @Override
        public LocalDate read(JsonReader in) throws IOException {
            switch (in.peek()) {
                case NULL:
                    in.nextNull();
                    return null;
                default:
                    String date = in.nextString();
                    return LocalDate.parse(date, formatter);
            }
        }
    }

    public class EnumAdapterFactory implements TypeAdapterFactory
    {

        @Override
        public <T> TypeAdapter<T> create(final Gson gson, final TypeToken<T> type)
        {
            Class<? super T> rawType = type.getRawType();
            if (rawType.isEnum())
            {
                return new EnumTypeAdapter<T>();
            }
            return null;
        }

        public class EnumTypeAdapter<T> extends TypeAdapter<T>
        {
            @Override
            public void write(JsonWriter out, T value) throws IOException
            {
                if (value == null || !value.getClass().isEnum())
                {
                    out.nullValue();
                    return;
                }

                out.value(value.toString());
            }

            public T read(JsonReader in) throws IOException
            {
//            	JsonToken nextToken = in.peek();
            	in.skipValue();
//            	return Enum.valueOf(T.class, in.nextString());
            	return null;
            }
        }
    }
    
    public class ApiImplUrlInvocazioneViewAdapter extends TypeAdapter<ApiImplUrlInvocazioneView> {

        public ApiImplUrlInvocazioneViewAdapter() {
        }

        @Override
        public void write(JsonWriter out, ApiImplUrlInvocazioneView tipoInterfaccia) throws IOException {
//            if (tipoInterfaccia == null) {
                out.nullValue();
//            } else {
//                out.value(formatter.format(tipoInterfaccia));
//            }
        }

        @Override
        public ApiImplUrlInvocazioneView read(JsonReader reader) throws IOException {
            reader.beginObject(); 
            String fieldname = null; 
            
            ApiImplUrlInvocazioneView w = new ApiImplUrlInvocazioneView();
            while (reader.hasNext()) { 
               JsonToken token = reader.peek();            
               
               if (token.equals(JsonToken.NAME)) {     
                  //get the current token 
                  fieldname = reader.nextName(); 
               } 
               
               if ("url_invocazione".equals(fieldname)) {       
                  //move to next token 
                  token = reader.peek(); 
                  
                  w.setUrlInvocazione(reader.nextString());
               } else {
            	   reader.skipValue();
               } 
               
            } 
            reader.endObject(); 
            return w; 

        }
    }

    public class OneOfApiBaseTipoInterfacciaAdapter extends TypeAdapter<OneOfApiBaseTipoInterfaccia> {

        public OneOfApiBaseTipoInterfacciaAdapter() {
        }

        @Override
        public void write(JsonWriter out, OneOfApiBaseTipoInterfaccia tipoInterfaccia) throws IOException {
//            if (tipoInterfaccia == null) {
                out.nullValue();
//            } else {
//                out.value(formatter.format(tipoInterfaccia));
//            }
        }

        @Override
        public OneOfApiBaseTipoInterfaccia read(JsonReader reader) throws IOException {
            reader.beginObject(); 
            String fieldname = null; 
            
            while (reader.hasNext()) { 
               JsonToken token = reader.peek();            
               
               if (token.equals(JsonToken.NAME)) {     
                  //get the current token 
                  fieldname = reader.nextName(); 
               } 
               
               if ("protocollo".equals(fieldname)) {       
                  //move to next token 
                  token = reader.peek(); 
                  
                  String type = reader.nextString();
			      if(type.equals("soap")){
  			        return new ApiInterfacciaSoap().protocollo(TipoApiEnum.SOAP); 
  			      } else if(type.equals("rest")) {
  			    	return new ApiInterfacciaRest().protocollo(TipoApiEnum.REST);
  			      } else {
  			        return null; //returning null will trigger Gson's default behavior
  			      }
               } 
               
            } 
            reader.endObject(); 
            return null; 

        }
    }

    public class OneOfControlloAccessiAutenticazioneAutenticazioneAdapter extends TypeAdapter<OneOfControlloAccessiAutenticazioneAutenticazione> {

        public OneOfControlloAccessiAutenticazioneAutenticazioneAdapter() {
        }

        @Override
        public void write(JsonWriter out, OneOfControlloAccessiAutenticazioneAutenticazione tipoInterfaccia) throws IOException {
//            if (tipoInterfaccia == null) {
                out.nullValue();
//            } else {
//                out.value(formatter.format(tipoInterfaccia));
//            }
        }

        @Override
        public OneOfControlloAccessiAutenticazioneAutenticazione read(JsonReader reader) throws IOException {
            reader.beginObject(); 
            String fieldname = null; 
            OneOfControlloAccessiAutenticazioneAutenticazione aut = null;
            while (reader.hasNext()) { 
               JsonToken token = reader.peek();            
               
               if (token.equals(JsonToken.NAME)) {     
                  //get the current token 
                  fieldname = reader.nextName(); 
               } 
               
               if (aut == null && "tipo".equals(fieldname)) {       
                  //move to next token 
                  token = reader.peek(); 
                  
                  String type = reader.nextString();
                  
			      if(type.equals(TipoAutenticazioneEnum.DISABILITATO.toString())){
			    	  aut = new APIImplAutenticazioneDisabilitata().tipo(TipoAutenticazioneEnum.DISABILITATO); 
  			      } else if(type.equals(TipoAutenticazioneEnum.HTTP_BASIC.toString())){
  			    	aut = new APIImplAutenticazioneBasic().tipo(TipoAutenticazioneEnum.HTTP_BASIC);
  			      } else if(type.equals(TipoAutenticazioneEnum.HTTPS.toString())){
  			    	aut = new APIImplAutenticazioneHttps().tipo(TipoAutenticazioneEnum.HTTPS);
  			      } else if(type.equals(TipoAutenticazioneEnum.PRINCIPAL.toString())){
  			    	aut = new APIImplAutenticazionePrincipal().tipo(TipoAutenticazioneEnum.PRINCIPAL);
  			      } else if(type.equals(TipoAutenticazioneEnum.API_KEY.toString())){
  			    	aut = new APIImplAutenticazioneApiKey().tipo(TipoAutenticazioneEnum.API_KEY);
  			      } else if(type.equals(TipoAutenticazioneEnum.CUSTOM.toString())){
  			    	aut = new APIImplAutenticazioneCustom().tipo(TipoAutenticazioneEnum.CUSTOM);
//  			      } else {
//  			        return null; //returning null will trigger Gson's default behavior
  			      }
               } else {
            	   reader.skipValue();
               }
               
            } 
            reader.endObject(); 
            return aut; 

        }
    }

    public class OneOfControlloAccessiAutenticazioneAutorizzazioneAdapter extends TypeAdapter<OneOfControlloAccessiAutorizzazioneViewAutorizzazione> {

        public OneOfControlloAccessiAutenticazioneAutorizzazioneAdapter() {
        }

        @Override
        public void write(JsonWriter out, OneOfControlloAccessiAutorizzazioneViewAutorizzazione tipoInterfaccia) throws IOException {
//            if (tipoInterfaccia == null) {
                out.nullValue();
//            } else {
//                out.value(formatter.format(tipoInterfaccia));
//            }
        }

        @Override
        public OneOfControlloAccessiAutorizzazioneViewAutorizzazione read(JsonReader reader) throws IOException {
            reader.beginObject(); 
            String fieldname = null; 
            OneOfControlloAccessiAutorizzazioneViewAutorizzazione aut = null;
            
            Map<String, Object> values = new HashMap<>();
            while (reader.hasNext()) { 
               JsonToken token = reader.peek();            
               
               if (token.equals(JsonToken.NAME)) {     
                  //get the current token 
                  fieldname = reader.nextName(); 
               } 
               
               if (aut == null && "tipo".equals(fieldname)) {       
                  //move to next token 
                  token = reader.peek(); 
                  
                  String type = reader.nextString();
                  
			      if(type.equals(TipoAutorizzazioneEnum.DISABILITATO.toString())){
			    	  aut = new APIImplAutorizzazioneDisabilitata().tipo(TipoAutorizzazioneEnum.DISABILITATO); 
  			      } else if(type.equals(TipoAutorizzazioneEnum.ABILITATO.toString())){
  			    	aut = new APIImplAutorizzazioneAbilitata().tipo(TipoAutorizzazioneEnum.ABILITATO);
  			      } else if(type.equals(TipoAutorizzazioneEnum.XACML_POLICY.toString())){
  			    	aut = new APIImplAutorizzazioneXACMLView().tipo(TipoAutorizzazioneEnum.XACML_POLICY);
  			      } else if(type.equals(TipoAutorizzazioneEnum.CUSTOM.toString())){
  			    	aut = new APIImplAutorizzazioneCustom().tipo(TipoAutorizzazioneEnum.CUSTOM);
//  			      } else {
//  			        return null; //returning null will trigger Gson's default behavior
  			      }
               } else if ("token".equals(fieldname)) {       
            	   values.put(fieldname, reader.nextBoolean());
               } else if ("token_claims".equals(fieldname)) {       
            	   values.put(fieldname, reader.nextString());
               } else {
            	   reader.skipValue();
               }
               
            } 
            reader.endObject();
            
            switch(aut.getTipo()) {
			case ABILITATO: ((APIImplAutorizzazioneAbilitata)aut).setToken((Boolean)values.get("token")); ((APIImplAutorizzazioneAbilitata)aut).setTokenClaims((String)values.get("token_claims"));
				break;
			case CUSTOM:
				break;
			case DISABILITATO:
				break;
			case XACML_POLICY:
				break;
			default:
				break;}
            return aut; 

        }
    }

    public ExtendedJSON setOffsetDateTimeFormat(DateTimeFormatter dateFormat) {
        offsetDateTimeTypeAdapter.setFormat(dateFormat);
        return this;
    }

    public ExtendedJSON setLocalDateFormat(DateTimeFormatter dateFormat) {
        localDateTypeAdapter.setFormat(dateFormat);
        return this;
    }

    /**
     * Gson TypeAdapter for java.sql.Date type
     * If the dateFormat is null, a simple "yyyy-MM-dd" format will be used
     * (more efficient than SimpleDateFormat).
     */
    public static class SqlDateTypeAdapter extends TypeAdapter<java.sql.Date> {

        private DateFormat dateFormat;

        public SqlDateTypeAdapter() {
        }

        public SqlDateTypeAdapter(DateFormat dateFormat) {
            this.dateFormat = dateFormat;
        }

        public void setFormat(DateFormat dateFormat) {
            this.dateFormat = dateFormat;
        }

        @Override
        public void write(JsonWriter out, java.sql.Date date) throws IOException {
            if (date == null) {
                out.nullValue();
            } else {
                String value;
                if (dateFormat != null) {
                    value = dateFormat.format(date);
                } else {
                    value = date.toString();
                }
                out.value(value);
            }
        }

        @Override
        public java.sql.Date read(JsonReader in) throws IOException {
            switch (in.peek()) {
                case NULL:
                    in.nextNull();
                    return null;
                default:
                    String date = in.nextString();
                    try {
                        if (dateFormat != null) {
                            return new java.sql.Date(dateFormat.parse(date).getTime());
                        }
                        return new java.sql.Date(ISO8601Utils.parse(date, new ParsePosition(0)).getTime());
                    } catch (ParseException e) {
                        throw new JsonParseException(e);
                    }
            }
        }
    }

    /**
     * Gson TypeAdapter for java.util.Date type
     * If the dateFormat is null, ISO8601Utils will be used.
     */
    public static class DateTypeAdapter extends TypeAdapter<Date> {

        private DateFormat dateFormat;

        public DateTypeAdapter() {
        }

        public DateTypeAdapter(DateFormat dateFormat) {
            this.dateFormat = dateFormat;
        }

        public void setFormat(DateFormat dateFormat) {
            this.dateFormat = dateFormat;
        }

        @Override
        public void write(JsonWriter out, Date date) throws IOException {
            if (date == null) {
                out.nullValue();
            } else {
                String value;
                if (dateFormat != null) {
                    value = dateFormat.format(date);
                } else {
                    value = ISO8601Utils.format(date, true);
                }
                out.value(value);
            }
        }

        @Override
        public Date read(JsonReader in) throws IOException {
            try {
                switch (in.peek()) {
                    case NULL:
                        in.nextNull();
                        return null;
                    default:
                        String date = in.nextString();
                        try {
                            if (dateFormat != null) {
                                return dateFormat.parse(date);
                            }
                            return ISO8601Utils.parse(date, new ParsePosition(0));
                        } catch (ParseException e) {
                            throw new JsonParseException(e);
                        }
                }
            } catch (IllegalArgumentException e) {
                throw new JsonParseException(e);
            }
        }
    }

    public ExtendedJSON setDateFormat(DateFormat dateFormat) {
        dateTypeAdapter.setFormat(dateFormat);
        return this;
    }

    public ExtendedJSON setSqlDateFormat(DateFormat dateFormat) {
        sqlDateTypeAdapter.setFormat(dateFormat);
        return this;
    }

}
