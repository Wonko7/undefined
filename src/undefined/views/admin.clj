(ns undefined.views.admin
  (:use [noir.core :only [defpage pre-route]]
        [noir.response :only [redirect]]
        [undefined.views.common :only [base page login]])
  (:require [net.cgrand.enlive-html :as html]
            [noir.session :as session]
            [noir.server :as server]
            [cemerick.friend :as friend]
            (cemerick.friend [workflows :as workflows]
                             [credentials :as creds])))

;;;   ;[noir.statuses]
;;;   ;[noir.request :only [ring-request]]
;;;   ;; ;(pre-route "/admin/*"
;;;   ;; ; ; (let [req       "lol";(ring-request)
;;;   ;; ; ;       ;https-url (str "https://" (:server-name req) ":8084" (:uri req))
;;;   ;; ; ;       ]
;;;   ;; ; ;   (when (= :http (:scheme req))
;;;   ;; ; ;     (redirect https-url)))
;;;   ;; ;      (redirect "lol")
;;;   ;; ;           )
;;;   

;;(defpage "/logout" []
;;      (session/clear!)
;;      (redirect "/"))
;;
;;(defpage "/login" []
;;  (base (page "Log In:" (login))))
;;
;;(server/add-middleware
;;  friend/authenticate
;;  {:credential-fn (partial creds/bcrypt-credential-fn users)
;;   :workflows [(workflows/interactive-form)]
;;   :login-uri "/login"
;;   :unauthorized-redirect-uri "/404"
;;   :default-landing-uri "/"})

;;;   ;; (pre-route [:get ["/:path" :path #"(?!login|logout)*"]] {:as req}
;;;   ;;            (friend/authenticated
;;;   ;;              ; We don't need to do anything, we just want to make sure we're
;;;   ;;              ; authenticated.
;;;   ;;              nil))
;;;   
;;;   ;; (def ring-app ; ... assemble routes however you like ...
;;;   ;;   )
;;;   ;;
;;;   ;; (def secured-app
;;;   ;;   (-> ring-app
;;;   ;;     (friend/authenticate {:credential-fn (partial creds/bcrypt-credential-fn users)
;;;   ;;                           :workflows [(workflows/interactive-form)]})
;;;   ;;     ; ...required Ring middlewares ...
;;;   ;;     ))
