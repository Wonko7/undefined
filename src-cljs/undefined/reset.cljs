(ns undef.reset
  (:use [undef.pages :only [add-page-init! page-click]]
        [undef.misc :only [show-admin-stuff]]
        [undef.misc :only [restore-height
                           mk-validate-deco mk-pass-val mk-pass2-val
                           start-load stop-load]])
  (:require [fetch.remotes :as remotes]
            [enfocus.core :as ef])
  (:require-macros [fetch.macros :as fm]
                   [enfocus.macros :as em]))

(defn reset-page [token & [args]]
  (let [reset-password          (fn [e]
                                  (.preventDefault e)
                                  (do
                                    (start-load :#load_res :#submit-pass)
                                    (let  [newpass  (em/from (em/select [:#conf_pass]) (em/get-prop :value))]
                                      (fm/letrem  [res (reset_pass2_rem newpass token)]
                                        (do
                                          (em/at js/document [:.article] (em/substitute ""))
                                          (stop-load :#load_res :#submit-pass res))))))
        pass-submit-validator   (mk-validate-deco :#submit-pass #{:#new_pass :#conf_pass})
        pass2-val               (mk-pass2-val :#conf_pass :#new_pass pass-submit-validator)]
    (em/at js/document
           [:#new_pass]         (em/listen :input (mk-pass-val pass-submit-validator pass2-val))
           [:#conf_pass]        (em/listen :input pass2-val)
           [:form]              (em/listen :submit #(reset-password %)))))

(add-page-init! "reset" reset-page)
