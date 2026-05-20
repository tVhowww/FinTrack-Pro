package com.fintrack.transaction_service.configuration;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

@Component
public class FlywayJpaDependencyPostProcessor implements BeanFactoryPostProcessor {

    @Override
    public void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) throws BeansException {
        if (beanFactory.containsBeanDefinition("entityManagerFactory") && beanFactory.containsBeanDefinition("flyway")) {
            String[] dependsOn = beanFactory.getBeanDefinition("entityManagerFactory").getDependsOn();
            if (dependsOn == null) {
                beanFactory.getBeanDefinition("entityManagerFactory").setDependsOn("flyway");
            } else {
                String[] newDependsOn = new String[dependsOn.length + 1];
                System.arraycopy(dependsOn, 0, newDependsOn, 0, dependsOn.length);
                newDependsOn[dependsOn.length] = "flyway";
                beanFactory.getBeanDefinition("entityManagerFactory").setDependsOn(newDependsOn);
            }
        }
    }
}
