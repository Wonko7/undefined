(ns undefined.config
  (:require [clojure.java.io :as io])
  (:import  [java.io PushbackReader]
            [java.io File]))
           
(defn get-conf [k]
  (if (.exists (File. "conf"))
    (with-open [r (io/reader "conf")]
            (k (read (PushbackReader. r))))))

(def config {})

;; WARNING: not thread safe.
(defn set-config! [profile]
  (def config
    (into {:database (get (System/getenv) "SERVER" "undefined")
           :domain   "http://undefined.re"}
     (condp = profile
      :prod {:port      80
             :ssl-port  443
             :database  "undefined"}
      :dev  {:port      (Integer. (get (System/getenv) "PORT" "8000"))
             :ssl-port  (Integer. (get (System/getenv) "SSLPORT" "8084"))
             :domain   "http://localhost:8000"}
      :test {:port      (Integer. (get (System/getenv) "PORT" "8000"))
             :ssl-port  (Integer. (get (System/getenv) "SSLPORT" "8084"))}
      :else nil)))
  config)

(defn get-config []
  config)
