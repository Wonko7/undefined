(ns undefined.server
  (:require [noir.server :as server]))

(server/load-views-ns 'undefined.views)

;; FIXME make different ports for test build and release builds.
(defn -main [& m]
  (let [mode (keyword (or (first m) :dev))
        port (Integer. (get (System/getenv) "PORT" "8080"))]
    (server/start port {:mode mode
                        :ns 'undefined
                        :jetty-options {:ssl? true
                                        :ssl-port 8084
                                        ;; gen with: keytool -keystore keystore -alias jetty -genkey -keyalg RSA
                                        :keystore "keystore"
                                        :key-password "123456"}}
                  )))
