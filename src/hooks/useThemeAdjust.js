/**
 * 地图主题调试
 */
export function useThemeAdjust(viewer) {
    function changeImageryProviderColors(viewer, baseLayer, invertColor, filterRGB) {
        // 更改底图的着色器 代码
        const baseFragmentShaderSource =
            viewer.scene.globe._surfaceShaderSet.baseFragmentShaderSource.sources
        for (let i = 0; i < baseFragmentShaderSource.length; i++) {
            const oneSource = baseFragmentShaderSource[i]
            // 格式必须一致 不能多有空格 且保持版本一致性
            const strS = 'color = czm_saturation(color, textureSaturation);\n#endif\n'
            let strT = 'color = czm_saturation(color, textureSaturation);\n#endif\n'
            if (invertColor) {
                strT += `
                  color.r = 1.0 - color.r;
                  color.g = 1.0 - color.g;
                  color.b = 1.0 - color.b;
                `
                strT += `
                color.r = color.r * ${filterRGB[0]}.0/255.0;
                color.g = color.g * ${filterRGB[1]}.0/255.0;
                color.b = color.b * ${filterRGB[2]}.0/255.0;
                `
            }

            if (oneSource.indexOf(strS) !== -1) {
                baseFragmentShaderSource[i] = baseFragmentShaderSource[i].replace(strS, strT)
            }
        }
    }

    function colorRgb(inColor) {
        // 16进制颜色值的正则
        const reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/
        // 把颜色值变成小写
        let color = inColor.toLowerCase()
        if (reg.test(color)) {
            // 如果只有三位的值，需变成六位，如：#fff => #ffffff
            if (color.length === 4) {
                let colorNew = '#'
                for (let i = 1; i < 4; i += 1) {
                    colorNew += color.slice(i, i + 1).concat(color.slice(i, i + 1))
                }
                color = colorNew
            }
            // 处理六位的颜色值，转为RGB
            const colorChange = []
            for (let i = 1; i < 7; i += 2) {
                colorChange.push(parseInt('0x' + color.slice(i, i + 2)))
            }
            return colorChange
        }
        return []
    }

    function setFilter(baseLayer, invertColor = true, filterColor = '#4e70a6') {
        // 设置 滤镜效果
        let filterRGB = [255.0, 255.0, 255.0]
        if (filterColor !== '#000000' && filterColor !== '#ffffff') {
            filterRGB = colorRgb(filterColor)
        }
        // 更改cesium的着色器代码 关于滤镜和反色的 [在不更改cesium源文件的情况下]
        changeImageryProviderColors(viewer, baseLayer, invertColor, filterRGB)
    }

    return {
        setFilter
    }
}
